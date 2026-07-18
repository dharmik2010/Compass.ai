import re
import uuid
from datetime import datetime, timedelta
from typing import Optional


def generate_trip_email_address(trip_title: str, trip_id: uuid.UUID) -> str:
    slug = re.sub(r"[^a-z0-9]+", "", trip_title.lower())[:20]
    return f"{slug}-{trip_id.hex[:8]}@trips.platform.io"


def parse_duration(duration_str: str) -> Optional[int]:
    pattern = r"(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    match = re.match(pattern, duration_str.upper())
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def format_currency(amount: float, currency: str = "USD") -> str:
    symbols = {"USD": "$", "EUR": "\u20ac", "GBP": "\u00a3", "JPY": "\u00a5", "INR": "\u20b9"}
    symbol = symbols.get(currency, currency + " ")
    return f"{symbol}{amount:.2f}"


def split_expense_equal(total: float, members_count: int) -> float:
    if members_count <= 0:
        return 0.0
    return round(total / members_count, 2)


def calculate_progress(start_date: str, end_date: str) -> float:
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        now = datetime.now()
        total = (end - start).total_seconds()
        elapsed = (now - start).total_seconds()
        if total <= 0:
            return 0.0
        return max(0.0, min(100.0, (elapsed / total) * 100))
    except (ValueError, TypeError):
        return 0.0
