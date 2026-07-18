from typing import List, Dict, Any
import httpx
from ..config import settings


class MeteomaticsService:
    def __init__(self):
        self.username = settings.meteomatics_api_key
        self.password = settings.meteomatics_api_secret
        self.base_url = "https://api.meteomatics.com"

    async def get_weather_forecast(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        parameters: List[str] = None,
    ) -> Dict[str, Any]:
        if parameters is None:
            parameters = [
                "t_2m:C",
                "t_min_2m_24h:C",
                "t_max_2m_24h:C",
                "precip_24h:mm",
                "relative_humidity_2m:p",
                "wind_speed_10m:ms",
                "weather_symbol_24h:idx",
            ]

        param_str = ",".join(parameters)
        url = f"{self.base_url}/{start_date}T00:00:00Z--{end_date}T00:00:00Z:PT24H/{param_str}/{latitude},{longitude}/json"

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                auth=(self.username, self.password),
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_packing_recommendations(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
    ) -> Dict[str, Any]:
        forecast = await self.get_weather_forecast(latitude, longitude, start_date, end_date)

        recommendations = {
            "rain_gear_needed": False,
            "cold_weather_gear": False,
            "heat_protection": False,
            "wind_protection": False,
            "umbrella_needed": False,
        }

        try:
            for series in forecast.get("data", []):
                if series.get("parameter") == "precip_24h:mm":
                    for step in series.get("coordinates", [{}])[0].get("dates", []):
                        if float(step.get("value", 0)) > 5:
                            recommendations["rain_gear_needed"] = True
                            recommendations["umbrella_needed"] = True
                            break

                if series.get("parameter") == "t_min_2m_24h:C":
                    for step in series.get("coordinates", [{}])[0].get("dates", []):
                        val = float(step.get("value", 20))
                        if val < 5:
                            recommendations["cold_weather_gear"] = True
                        elif val > 30:
                            recommendations["heat_protection"] = True

                if series.get("parameter") == "wind_speed_10m:ms":
                    for step in series.get("coordinates", [{}])[0].get("dates", []):
                        if float(step.get("value", 0)) > 10:
                            recommendations["wind_protection"] = True
        except (KeyError, IndexError, ValueError):
            pass

        return recommendations


meteomatics_service = MeteomaticsService()
