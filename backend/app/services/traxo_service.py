import base64
import asyncio
from typing import BinaryIO
import httpx
from ..config import settings


class TraxoService:
    def __init__(self):
        self.api_key = settings.traxo_api_key
        self.base_url = "https://api.traxo.com/v2"

    async def parse_travel_document(self, file_content: bytes, filename: str) -> dict:
        encoded = base64.b64encode(file_content).decode("utf-8")

        async with httpx.AsyncClient() as client:
            job_resp = await client.post(
                f"{self.base_url}/travel/trip-parser-jobs",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
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

            for attempt in range(15):
                await asyncio.sleep(1)
                poll_resp = await client.get(
                    f"{self.base_url}/travel/trip-parser-jobs/{job_id}",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                poll_resp.raise_for_status()
                status_data = poll_resp.json()
                if status_data["data"]["status"] == "COMPLETED":
                    result_url = status_data["data"]["result"]["href"]
                    result_resp = await client.get(
                        result_url,
                        headers={"Authorization": f"Bearer {self.api_key}"},
                    )
                    result_resp.raise_for_status()
                    return result_resp.json()
                elif status_data["data"]["status"] == "FAILED":
                    raise Exception("Traxo parsing failed")

            raise Exception("Traxo parsing timed out")

    async def parse_hotel_folio(self, file_content: bytes, filename: str) -> dict:
        result = await self.parse_travel_document(file_content, filename)

        folio_data = {
            "hotel_name": "",
            "check_in": "",
            "check_out": "",
            "room_charges": 0.0,
            "taxes": 0.0,
            "ancillary_charges": [],
            "total_amount": 0.0,
            "currency": "USD",
            "reservation_code": "",
        }

        try:
            parsed = result.get("data", {}).get("attributes", {})
            folio_data["hotel_name"] = parsed.get("property_name", "")
            folio_data["check_in"] = parsed.get("check_in", "")
            folio_data["check_out"] = parsed.get("check_out", "")
            folio_data["total_amount"] = float(parsed.get("total_amount", 0))
            folio_data["reservation_code"] = parsed.get("confirmation_number", "")
        except (KeyError, ValueError):
            pass

        return folio_data


traxo_service = TraxoService()
