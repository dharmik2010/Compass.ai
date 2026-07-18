import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

import httpx

from .state import TripState
from ..config import settings
from ..services.cache_service import cache_service


class RealTimeSentinel:
    def __init__(self):
        self.places_api_key = settings.google_maps_api_key
        self.meteomatics_user = settings.meteomatics_api_key
        self.meteomatics_pass = settings.meteomatics_api_secret

    async def _fetch_crowd_data(self, place_name: str) -> Optional[Dict[str, Any]]:
        cache_key = f"crowd:{place_name.lower().strip()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        if not self.places_api_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
                    params={
                        "input": place_name,
                        "inputtype": "textquery",
                        "fields": "place_id,name,rating,user_ratings_total,types,geometry",
                        "key": self.places_api_key,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                if data.get("candidates"):
                    candidate = data["candidates"][0]
                    place_id = candidate.get("place_id")

                    pop_times = await self._estimate_crowd_from_popularity(place_id)
                    result = {
                        "place": candidate.get("name"),
                        "crowd_level": pop_times.get("current_crowd", "unknown"),
                        "peak_hours": pop_times.get("peak_hours", []),
                        "recommended_visit": pop_times.get("recommended_hours", []),
                        "rating": candidate.get("rating"),
                        "total_ratings": candidate.get("user_ratings_total"),
                    }
                    await cache_service.set(cache_key, result, ttl=3600)
                    return result
        except Exception:
            pass
        return None

    async def _estimate_crowd_from_popularity(self, place_id: str) -> Dict[str, Any]:
        if not self.places_api_key or not place_id:
            return {"current_crowd": "unknown"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/details/json",
                    params={
                        "place_id": place_id,
                        "fields": "popular_times,name,rating,current_opening_hours",
                        "key": self.places_api_key,
                    },
                )
                resp.raise_for_status()
                details = resp.json().get("result", {})

                current_hour = datetime.now().hour
                is_weekend = datetime.now().weekday() >= 5

                pop_times = details.get("popular_times", [])
                if pop_times:
                    day_data = pop_times[datetime.now().weekday()]
                    if current_hour < len(day_data):
                        density = day_data[current_hour]
                        if density < 33:
                            crowd = "low"
                        elif density < 66:
                            crowd = "medium"
                        else:
                            crowd = "high"

                        peak = [
                            i for i, d in enumerate(day_data)
                            if d > 66
                        ]
                        low = [
                            i for i, d in enumerate(day_data)
                            if d < 33
                        ]
                        return {
                            "current_crowd": crowd,
                            "peak_hours": [f"{h}:00" for h in peak],
                            "recommended_hours": [f"{h}:00" for h in low[:3]],
                        }

                hours = details.get("current_opening_hours", {})
                if hours.get("open_now") is False:
                    now = datetime.now()
                    if is_weekend:
                        return {
                            "current_crowd": "closed",
                            "peak_hours": [],
                            "recommended_hours": ["10:00", "14:00"],
                        }
                    return {
                        "current_crowd": "closed",
                        "peak_hours": [],
                        "recommended_hours": ["09:00", "13:00"],
                    }

        except Exception:
            pass

        return {"current_crowd": "unknown"}

    async def _fetch_municipal_alerts(self, latitude: float, longitude: float) -> List[Dict[str, str]]:
        alerts = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.weather.gov/alerts/active",
                    params={
                        "point": f"{latitude},{longitude}",
                    },
                    headers={"User-Agent": "AI-Travel-Planner/1.0"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for feature in data.get("features", [])[:5]:
                        props = feature.get("properties", {})
                        alerts.append({
                            "type": "municipal",
                            "severity": props.get("severity", "Unknown"),
                            "event": props.get("event", "Alert"),
                            "headline": props.get("headline", ""),
                            "description": props.get("description", "")[:300],
                            "instruction": props.get("instruction", ""),
                            "expires": props.get("expires", ""),
                        })
        except Exception:
            pass
        return alerts

    async def _predictive_threat_simulation(
        self,
        activities: List[Dict[str, Any]],
        latitude: float,
        longitude: float,
    ) -> List[Dict[str, Any]]:
        threats = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                met_url = (
                    f"https://api.meteomatics.com"
                    f"/{datetime.utcnow().strftime('%Y-%m-%dT00:00:00Z')}"
                    f"P7D:PT24H"
                    f"/t_2m:C,precip_24h:mm,weather_symbol_24h:idx"
                    f"/{latitude},{longitude}/json"
                )
                if self.meteomatics_user and self.meteomatics_pass:
                    met_resp = await client.get(
                        met_url,
                        auth=(self.meteomatics_user, self.meteomatics_pass),
                        timeout=15.0,
                    )
                    if met_resp.status_code == 200:
                        met_data = met_resp.json()
                        for series in met_data.get("data", []):
                            param = series.get("parameter")
                            if param == "precip_24h:mm":
                                for step in series.get("coordinates", [{}])[0].get("dates", []):
                                    val = float(step.get("value", 0))
                                    if val > 20:
                                        threats.append({
                                            "type": "weather",
                                            "severity": "warning",
                                            "message": (
                                                f"Heavy precipitation forecast ({val}mm/24h). "
                                                "Consider rescheduling outdoor excursions."
                                            ),
                                        })
                                    elif val > 10:
                                        threats.append({
                                            "type": "weather",
                                            "severity": "caution",
                                            "message": (
                                                f"Rain expected ({val}mm/24h). "
                                                "Pack waterproof gear."
                                            ),
                                        })
                            if param == "t_2m:C":
                                for step in series.get("coordinates", [{}])[0].get("dates", []):
                                    val = float(step.get("value", 25))
                                    if val > 40:
                                        threats.append({
                                            "type": "heat",
                                            "severity": "warning",
                                            "message": (
                                                f"Extreme heat forecast ({val}C). "
                                                "Avoid midday outdoor activities."
                                            ),
                                        })
                                    elif val < -10:
                                        threats.append({
                                            "type": "cold",
                                            "severity": "warning",
                                            "message": (
                                                f"Extreme cold forecast ({val}C). "
                                                "Ensure adequate winter clothing."
                                            ),
                                        })

            for activity in activities:
                tags = [t.lower() for t in activity.get("tags", [])]
                if "outdoor" in tags or "hiking" in tags:
                    has_weather_threat = any(
                        t["type"] == "weather" for t in threats
                    )
                    if not has_weather_threat:
                        threats.append({
                            "type": "activity",
                            "severity": "info",
                            "message": (
                                f"Outdoor activity '{activity.get('title')}' scheduled. "
                                "Check local weather before departure."
                            ),
                        })

        except Exception:
            pass

        return threats

    async def run_safety_assessment(
        self,
        destination: str,
        activities: List[Dict[str, Any]],
        latitude: float = 35.6762,
        longitude: float = 139.6503,
    ) -> Dict[str, Any]:
        crowd_task = self._fetch_crowd_data(destination)
        alerts_task = self._fetch_municipal_alerts(latitude, longitude)
        threat_task = self._predictive_threat_simulation(activities, latitude, longitude)

        crowd_data, municipal_alerts, threat_simulations = await asyncio.gather(
            crowd_task, alerts_task, threat_task
        )

        all_alerts = []

        if municipal_alerts:
            all_alerts.extend(municipal_alerts)

        all_alerts.extend(threat_simulations)

        if crowd_data and crowd_data.get("crowd_level") in ("high", "medium"):
            all_alerts.append({
                "type": "crowd",
                "severity": "caution" if crowd_data["crowd_level"] == "high" else "info",
                "location": crowd_data.get("place", destination),
                "message": (
                    f"Crowd level: {crowd_data['crowd_level']}. "
                    f"Recommended visit hours: "
                    f"{', '.join(crowd_data.get('recommended_hours', ['early morning']))}. "
                    f"Peak hours: {', '.join(crowd_data.get('peak_hours', ['afternoon']))}."
                ),
            })

        return {"safety_alerts": all_alerts, "crowd_data": crowd_data}


real_time_sentinel = RealTimeSentinel()


def sentinel_agent(state: TripState) -> dict:
    destination = state.get("destination", "")
    activities = state.get("activities", [])

    try:
        import asyncio as _asyncio
        loop = _asyncio.new_event_loop()
        _asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            real_time_sentinel.run_safety_assessment(destination, activities)
        )
        loop.close()
        return result
    except Exception:
        pass

    return {"safety_alerts": [], "crowd_data": None}
