import asyncio
import base64
import email
import imaplib
import json as json_mod
import re
from datetime import datetime
from email import policy
from email.utils import parsedate_to_datetime
from typing import List, Dict, Any, Optional
from uuid import UUID

import httpx
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from ..config import settings
from ..services.cache_service import cache_service


def encode_document_to_base64(file_path: str) -> str:
    with open(file_path, "rb") as target_file:
        encoded_bytes = base64.b64encode(target_file.read())
        return encoded_bytes.decode("utf-8")


class EmailHarvester:
    def __init__(self):
        self._llm = None
        self.amadeus_base = (
            "https://test.api.amadeus.com"
            if settings.amadeus_environment == "test"
            else "https://api.amadeus.com"
        )
        self.amadeus_token: Optional[str] = None

    def _get_llm(self):
        if self._llm is None and settings.openai_api_key:
            self._llm = ChatOpenAI(
                model=settings.openai_model,
                temperature=0.05,
                api_key=settings.openai_api_key,
            )
        return self._llm

    async def _get_amadeus_token(self) -> str:
        if self.amadeus_token:
            return self.amadeus_token
        if not settings.amadeus_api_key:
            return ""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.amadeus_base}/v1/security/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.amadeus_api_key,
                    "client_secret": settings.amadeus_api_secret,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            self.amadeus_token = data["access_token"]
            return self.amadeus_token

    def _generate_trip_email_address(self, trip_title: str, trip_id: UUID) -> str:
        slug = re.sub(r"[^a-z0-9]+", "", trip_title.lower())[:20]
        return f"{slug}-{trip_id.hex[:8]}@{settings.email_domain}"

    async def poll_inbox(self, email_address: str, email_password: str) -> List[Dict[str, Any]]:
        parsed_items = []
        try:
            mail = imaplib.IMAP4_SSL("imap.trips.platform.io" if "trips.platform.io" in email_address else "imap.gmail.com")
            mail.login(email_address, email_password)
            mail.select("INBOX")

            _, message_ids = mail.search(None, "UNSEEN")
            for mid in message_ids[0].split()[-10:]:
                _, msg_data = mail.fetch(mid, "(RFC822)")
                raw_email = msg_data[0][1]
                items = await self.parse_email(raw_email)
                parsed_items.extend(items)
                mail.store(mid, "+FLAGS", "\\Seen")

            mail.logout()
        except Exception:
            pass

        return parsed_items

    async def parse_email(self, raw_email: bytes) -> List[Dict[str, Any]]:
        msg = email.message_from_bytes(raw_email, policy=policy.default)
        parsed_items = []

        subject = msg.get("Subject", "")
        sender = msg.get("From", "")
        date = parsedate_to_datetime(msg.get("Date", ""))

        body = ""
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                ct = part.get_content_type()
                if ct == "text/plain":
                    body = part.get_content()
                elif ct == "text/html" and not body:
                    body = part.get_content()
                elif part.get_content_disposition() == "attachment":
                    attachments.append({
                        "filename": part.get_filename() or "attachment",
                        "content": part.get_payload(decode=True),
                        "content_type": ct,
                    })
        else:
            body = msg.get_content()

        combined_text = f"Subject: {subject}\nFrom: {sender}\n\n{body}"

        llm_result = await self._llm_parse(combined_text)
        if llm_result:
            parsed_items.append(llm_result)

        for att in attachments:
            amadeus_result = await self._amadeus_parse_document(att["content"], att["filename"])
            if amadeus_result:
                parsed_items.append(amadeus_result)

            traxo_result = await self._traxo_parse_document(att["content"], att["filename"])
            if traxo_result:
                parsed_items.append(traxo_result)

            folio = await self._parse_hotel_folio_from_bytes(att["content"], att["filename"])
            if folio:
                parsed_items.append(folio)

        return parsed_items

    async def _llm_parse(self, text: str) -> Optional[Dict[str, Any]]:
        prompt = (
            "Parse the following travel booking confirmation email. Extract structured data as JSON:\n"
            "{\n"
            '  "type": "flight" | "hotel" | "activity",\n'
            '  "provider": "...",\n'
            '  "confirmation_number": "...",\n'
            '  "check_in" | "departure": "YYYY-MM-DD",\n'
            '  "check_out" | "arrival": "YYYY-MM-DD",\n'
            '  "amount": 123.45,\n'
            '  "currency": "USD",\n'
            '  "origin": "JFK",\n'
            '  "destination": "NRT",\n'
            '  "passengers": 2,\n'
            '  "items": [{"description": "...", "amount": 12.34}]\n'
            "}\n"
            "If it's not a travel booking, return null.\n\n"
            f"---EMAIL---\n{text[:8000]}"
        )

        try:
            msg = HumanMessage(content=prompt)
            response = await self._get_llm().ainvoke([msg])
            content = response.content.strip()

            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
            if json_match:
                content = json_match.group(1)

            result = json_mod.loads(content)
            if result and isinstance(result, dict) and result.get("type"):
                result["source"] = "llm_parsed"
                return result
        except Exception:
            pass

        return None

    async def _amadeus_parse_document(self, file_content: bytes, filename: str) -> Optional[Dict[str, Any]]:
        token = await self._get_amadeus_token()
        if not token:
            return None

        encoded = base64.b64encode(file_content).decode("utf-8")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                job_resp = await client.post(
                    f"{self.amadeus_base}/v2/travel/trip-parser-jobs",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json={"data": {"type": "trip-parser-job", "content": encoded}},
                )
                job_resp.raise_for_status()
                job_id = job_resp.json()["data"]["id"]

                for attempt in range(15):
                    await asyncio.sleep(1)
                    poll_resp = await client.get(
                        f"{self.amadeus_base}/v2/travel/trip-parser-jobs/{job_id}",
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
                        parsed = result_resp.json()
                        parsed["source"] = "amadeus"
                        parsed["filename"] = filename
                        return parsed
                    elif status_data["data"]["status"] == "FAILED":
                        return None

        except Exception:
            pass
        return None

    async def _traxo_parse_document(self, file_content: bytes, filename: str) -> Optional[Dict[str, Any]]:
        if not settings.traxo_api_key:
            return None

        encoded = base64.b64encode(file_content).decode("utf-8")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                job_resp = await client.post(
                    "https://api.traxo.com/v2/travel/trip-parser-jobs",
                    headers={
                        "Authorization": f"Bearer {settings.traxo_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"data": {"type": "trip-parser-job", "content": encoded}},
                )
                job_resp.raise_for_status()
                job_id = job_resp.json()["data"]["id"]

                for attempt in range(15):
                    await asyncio.sleep(1)
                    poll_resp = await client.get(
                        f"https://api.traxo.com/v2/travel/trip-parser-jobs/{job_id}",
                        headers={"Authorization": f"Bearer {settings.traxo_api_key}"},
                    )
                    poll_resp.raise_for_status()
                    status_data = poll_resp.json()
                    if status_data["data"]["status"] == "COMPLETED":
                        result_url = status_data["data"]["result"]["href"]
                        result_resp = await client.get(
                            result_url,
                            headers={"Authorization": f"Bearer {settings.traxo_api_key}"},
                        )
                        result_resp.raise_for_status()
                        parsed = result_resp.json()
                        parsed["source"] = "traxo"
                        parsed["filename"] = filename
                        return parsed
                    elif status_data["data"]["status"] == "FAILED":
                        return None
        except Exception:
            pass
        return None

    async def _parse_hotel_folio_from_bytes(self, file_content: bytes, filename: str) -> Optional[Dict[str, Any]]:
        text = ""
        try:
            if filename.lower().endswith(".pdf"):
                import io
                from pdfminer.high_level import extract_text as pdf_extract
                text = pdf_extract(io.BytesIO(file_content))
            elif filename.lower().endswith((".html", ".htm")):
                text = file_content.decode("utf-8", errors="ignore")
            elif filename.lower().endswith(".eml"):
                msg = email.message_from_bytes(file_content, policy=policy.default)
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            text = part.get_content()
                            break
                else:
                    text = msg.get_content()
            else:
                text = file_content.decode("utf-8", errors="ignore")
        except Exception:
            text = file_content.decode("utf-8", errors="ignore")

        if not text or len(text) < 50:
            return None

        folio_keywords = [
            "hotel folio", "guest folio", "bill", "invoice", "receipt",
            "check-out", "checkout", "room charge", "incidental",
            "hotel charge", "accommodation",
        ]
        if not any(kw in text.lower() for kw in folio_keywords):
            return None

        prompt = (
            "Parse the following hotel folio / invoice / receipt. "
            "Extract as JSON with keys:\n"
            "type, property_name, check_in, check_out, room_charge, "
            "taxes, total_amount, currency, confirmation_number, "
            "items (list of {description, amount}).\n"
            "Return null if not a hotel folio.\n\n"
            f"---DOCUMENT---\n{text[:5000]}"
        )

        try:
            msg = HumanMessage(content=prompt)
            response = await self._get_llm().ainvoke([msg])
            content = response.content.strip()

            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
            if json_match:
                content = json_match.group(1)

            result = json_mod.loads(content)
            if result and isinstance(result, dict):
                result["source"] = "folio_parser"
                result["filename"] = filename
                return result
        except Exception:
            pass

        return None


email_harvester = EmailHarvester()
