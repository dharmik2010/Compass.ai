from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict
from operator import add
from langchain_core.messages import BaseMessage


def merge_validation_errors(existing: List[str], new_errors: List[str]) -> List[str]:
    return existing + new_errors


class TripState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    destination: str
    origin: str
    start_date: str
    end_date: str
    budget: float
    interests: List[str]
    group_size: int
    packing_style: str

    flights: Annotated[List[Dict[str, Any]], add]
    hotels: Annotated[List[Dict[str, Any]], add]
    activities: Annotated[List[Dict[str, Any]], add]

    errors: Annotated[List[str], merge_validation_errors]
    itinerary_draft: str
    approved: bool
    packing_list: Dict[str, Any]
    safety_alerts: List[Dict[str, Any]]
    trade_off_scores: Dict[str, Any]
