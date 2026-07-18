import asyncio
import base64
import io
import re
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, parse_qs

import httpx
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from ..config import settings
from ..services.cache_service import cache_service


class SocialVideoIngestionEngine:
    PLATFORMS = {
        "tiktok": r"(?:https?://)?(?:www\.)?tiktok\.com/@[\w.-]+/video/\d+",
        "instagram": r"(?:https?://)?(?:www\.)?instagram\.com/(?:p|reel)/[\w-]+",
        "youtube": r"(?:https?://)?(?:www\.)?youtube\.com/(?:watch\?v=|shorts/)[\w-]{11}",
    }

    def __init__(self):
        self.places_api_key = settings.google_maps_api_key
        self._vision_llm = None
        self.place_search_url = "https://maps.googleapis.com/maps/api/place"

    def _get_vision_llm(self):
        if self._vision_llm is None and settings.openai_api_key:
            self._vision_llm = ChatOpenAI(
                model="gpt-4o",
                temperature=0.1,
                api_key=settings.openai_api_key,
            )
        return self._vision_llm

    def detect_platform(self, url: str) -> Optional[str]:
        for platform, pattern in self.PLATFORMS.items():
            if re.match(pattern, url):
                return platform
        return None

    async def _fetch_video_frames(self, url: str) -> List[bytes]:
        platform = self.detect_platform(url)
        if not platform:
            return []

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                resp = await client.get(url, headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/125.0.0.0 Safari/537.36"
                    )
                })
                resp.raise_for_status()
                html = resp.text

                og_image_match = re.search(
                    r'<meta\s+property="og:image"\s+content="([^"]+)"',
                    html
                )
                if og_image_match:
                    img_url = og_image_match.group(1)
                    img_resp = await client.get(img_url, timeout=15.0)
                    img_resp.raise_for_status()
                    return [img_resp.content]

                thumbnail_patterns = [
                    r'https?://i\.ytimg\.com/vi/[\w-]{11}/hqdefault\.jpg',
                    r'https?://[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?',
                ]
                for pattern in thumbnail_patterns:
                    match = re.search(pattern, html)
                    if match:
                        img_resp = await client.get(match.group(0), timeout=15.0)
                        img_resp.raise_for_status()
                        return [img_resp.content]

                return []
        except Exception:
            return []

    async def _gpt4o_vision_analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        llm = self._get_vision_llm()
        if not llm:
            return {
                "location_names": [], "on_screen_text": [],
                "activities": [], "cuisine_type": None,
                "crowd_level": "unknown", "vibe": "unknown",
            }

        b64 = base64.b64encode(image_bytes).decode("utf-8")

        msg = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": (
                        "Analyze this travel-related image/frame. Extract ALL of the following:\n"
                        "1. location_names: list of place names, landmarks, restaurants, hotels, "
                        "or attractions visible or mentioned\n"
                        "2. on_screen_text: any text visible (OCR) - restaurant names, "
                        "location tags, hashtags\n"
                        "3. activities: any visible activities (hiking, eating, swimming, etc.)\n"
                        "4. cuisine_type: if food is visible, describe the cuisine\n"
                        "5. crowd_level: estimated crowd level (empty/low/medium/high)\n"
                        "6. vibe: atmosphere description (romantic/adventurous/relaxing/luxury/budget)\n"
                        "\nReturn as JSON with keys: location_names, on_screen_text, activities, "
                        "cuisine_type, crowd_level, vibe"
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{b64}",
                        "detail": "high",
                    },
                },
            ]
        )

        response = await llm.ainvoke([msg])
        content = response.content.strip()

        import json as json_mod
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if json_match:
            content = json_match.group(1)

        try:
            return json_mod.loads(content)
        except json_mod.JSONDecodeError:
            return {
                "location_names": [],
                "on_screen_text": [],
                "activities": [],
                "cuisine_type": None,
                "crowd_level": "unknown",
                "vibe": "unknown",
            }

    async def _search_google_places(self, query: str) -> List[Dict[str, Any]]:
        cache_key = f"places:{query.lower().strip()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        if not self.places_api_key:
            return [{"name": query, "place_id": None, "coordinates": None}]

        results = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.place_search_url}/findplacefromtext/json",
                params={
                    "input": query,
                    "inputtype": "textquery",
                    "fields": "place_id,name,geometry,rating,formatted_address,"
                              "price_level,types,user_ratings_total,reviews",
                    "key": self.places_api_key,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            for candidate in data.get("candidates", []):
                place_id = candidate.get("place_id")
                detail = await self._get_place_details(place_id)
                results.append({
                    "name": candidate.get("name", query),
                    "place_id": place_id,
                    "coordinates": candidate.get("geometry", {}).get("location"),
                    "address": candidate.get("formatted_address"),
                    "rating": candidate.get("rating"),
                    "price_level": candidate.get("price_level"),
                    "types": candidate.get("types", []),
                    "reviews": detail.get("reviews", []),
                    "sentiment": self._aggregate_sentiment(detail.get("reviews", [])),
                })

        await cache_service.set(cache_key, results, ttl=86400)
        return results

    async def _get_place_details(self, place_id: str) -> Dict[str, Any]:
        if not self.places_api_key or not place_id:
            return {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.place_search_url}/details/json",
                params={
                    "place_id": place_id,
                    "fields": "reviews,rating,user_ratings_total,opening_hours,website",
                    "key": self.places_api_key,
                },
            )
            resp.raise_for_status()
            return resp.json().get("result", {})

    def _aggregate_sentiment(self, reviews: List[Dict]) -> Dict[str, Any]:
        if not reviews:
            return {"score": 0, "positive": 0, "negative": 0, "neutral": 0}

        positive = sum(1 for r in reviews if r.get("rating", 0) >= 4)
        negative = sum(1 for r in reviews if r.get("rating", 0) <= 2)
        neutral = len(reviews) - positive - negative

        avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0

        return {
            "score": round(avg_rating, 1),
            "total_reviews": len(reviews),
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
        }

    async def extract_video_metadata(self, url: str) -> Dict[str, Any]:
        platform = self.detect_platform(url)
        if not platform:
            return {"error": "Unsupported platform", "url": url}

        return {
            "platform": platform,
            "url": url,
            "status": "metadata_extracted",
        }

    async def extract_pois_from_video(self, url: str) -> List[Dict[str, Any]]:
        metadata = await self.extract_video_metadata(url)
        if "error" in metadata:
            return []

        frames = await self._fetch_video_frames(url)
        if not frames:
            return []

        extraction_tasks = [self._gpt4o_vision_analyze(frame) for frame in frames]
        vision_results = await asyncio.gather(*extraction_tasks)

        all_pois = []
        seen_names = set()

        for vision_data in vision_results:
            location_names = vision_data.get("location_names", [])
            on_screen_text = vision_data.get("on_screen_text", [])
            activities = vision_data.get("activities", [])

            search_queries = location_names + [
                t for t in on_screen_text
                if len(t) > 3 and not t.startswith("#")
            ]

            place_tasks = [self._search_google_places(q) for q in search_queries[:5]]
            place_results = await asyncio.gather(*place_tasks)

            for places in place_results:
                for place in places:
                    name = place.get("name", "").lower()
                    if name and name not in seen_names:
                        seen_names.add(name)
                        all_pois.append(place)

        return {
            "pois": all_pois,
            "vision_data": vision_results[0] if vision_results else {},
            "platform": metadata.get("platform"),
        }

    def _get_video_id(self, url: str, platform: str) -> Optional[str]:
        parsed = urlparse(url)
        if platform == "youtube":
            return parse_qs(parsed.query).get("v", [None])[0]
        elif platform == "instagram":
            match = re.search(r"/(?:p|reel)/([\w-]+)", url)
            return match.group(1) if match else None
        elif platform == "tiktok":
            match = re.search(r"/video/(\d+)", url)
            return match.group(1) if match else None
        return None


social_ingestion_engine = SocialVideoIngestionEngine()
