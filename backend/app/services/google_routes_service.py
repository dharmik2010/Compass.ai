import json
import re
from typing import List, Dict, Any
import httpx
from ..config import settings


class GoogleRoutesService:
    def __init__(self):
        self.api_key = settings.google_maps_api_key
        self.base_url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    async def optimize_waypoints(
        self,
        origin: Dict[str, float],
        destination: Dict[str, float],
        intermediates: List[Dict[str, Any]],
        travel_mode: str = "DRIVE",
    ) -> Dict[str, Any]:
        waypoints = []
        for wp in intermediates:
            waypoints.append({
                "address": wp.get("address", ""),
                "via": wp.get("via", False),
            })

        body = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": origin["lat"],
                        "longitude": origin["lng"],
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": destination["lat"],
                        "longitude": destination["lng"],
                    }
                }
            },
            "intermediates": [
                {
                    "address": wp["address"],
                    "via": wp["via"],
                }
                for wp in waypoints
            ],
            "travelMode": travel_mode,
            "routingPreference": "TRAFFIC_AWARE",
            "optimizeWaypointOrder": True,
            "polylineQuality": "HIGH_QUALITY",
            "extraComputations": ["TOLLS", "TRAFFIC_ON_POLYLINE"],
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.base_url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": self.api_key,
                    "X-Goog-FieldMask": (
                        "routes.duration,routes.distanceMeters,"
                        "routes.polyline,routes.optimizedIntermediateWaypointIndex"
                    ),
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

            raw = json.dumps(data)
            clean = re.sub(r'[\x00-\x1f\x7f]', '', raw)
            return json.loads(clean)

    async def compute_route(
        self,
        origin: Dict[str, float],
        destination: Dict[str, float],
        intermediates: List[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        waypoints = []
        if intermediates:
            for wp in intermediates:
                waypoints.append({
                    "location": {
                        "latLng": {
                            "latitude": wp["lat"],
                            "longitude": wp["lng"],
                        }
                    }
                })

        body = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": origin["lat"],
                        "longitude": origin["lng"],
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": destination["lat"],
                        "longitude": destination["lng"],
                    }
                }
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "polylineQuality": "HIGH_QUALITY",
        }
        if waypoints:
            body["intermediates"] = waypoints

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.base_url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": self.api_key,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            return resp.json()


google_routes_service = GoogleRoutesService()
