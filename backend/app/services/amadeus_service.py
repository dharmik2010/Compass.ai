import base64
import json
from typing import Optional
import httpx
from ..config import settings


class AmadeusService:
    def __init__(self):
        self.api_key = settings.amadeus_api_key
        self.api_secret = settings.amadeus_api_secret
        self.base_url = (
            "https://test.api.amadeus.com"
            if settings.amadeus_environment == "test"
            else "https://api.amadeus.com"
        )
        self._token: Optional[str] = None

    async def _get_token(self) -> str:
        if self._token:
            return self._token
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/v1/security/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.api_key,
                    "client_secret": self.api_secret,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            self._token = data["access_token"]
            return self._token

    async def search_flights(self, origin: str, destination: str, date: str, passengers: int = 1):
        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/v2/shopping/flight-offers",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "originLocationCode": origin,
                    "destinationLocationCode": destination,
                    "departureDate": date,
                    "adults": passengers,
                    "currencyCode": "USD",
                    "max": 5,
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def parse_trip_email(self, file_content: bytes, filename: str) -> dict:
        token = await self._get_token()
        encoded = base64.b64encode(file_content).decode("utf-8")

        async with httpx.AsyncClient() as client:
            job_resp = await client.post(
                f"{self.base_url}/v2/travel/trip-parser-jobs",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "data": {
                        "type": "trip-parser-job",
                        "content": encoded,
                    }
                },
            )
            job_resp.raise_for_status()
            job_data = job_resp.json()
            job_id = job_data["data"]["id"]

            import asyncio
            for attempt in range(10):
                await asyncio.sleep(1)
                poll_resp = await client.get(
                    f"{self.base_url}/v2/travel/trip-parser-jobs/{job_id}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                poll_resp.raise_for_status()
                status_data = poll_resp.json()
                if status_data["data"]["status"] == "COMPLETED":
                    result_url = status_data["data"]["result"]["href"]
                    result_resp = await client.get(
                        result_url,
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    result_resp.raise_for_status()
                    return result_resp.json()
                elif status_data["data"]["status"] == "FAILED":
                    raise Exception("Trip parsing failed")

            raise Exception("Trip parsing timed out")


amadeus_service = AmadeusService()
