from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TripCreate(BaseModel):
    title: str
    destination: str
    origin: str
    start_date: date
    end_date: date
    budget: float = 0.0
    interests: List[str] = []
    group_size: int = 1
    packing_style: str = "balanced"


class TripResponse(BaseModel):
    id: UUID
    title: str
    destination: str
    start_date: datetime
    end_date: datetime
    budget: float
    owner_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TripDetailResponse(TripResponse):
    itinerary: Optional[str] = None
    packing_list: Optional[Dict[str, Any]] = None
    safety_alerts: Optional[List[Dict[str, Any]]] = None
    trade_off_scores: Optional[Dict[str, Any]] = None
    members: List[Dict[str, Any]] = []


class TripPlanRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str
    budget: float = 1000.0
    interests: List[str] = ["history", "food"]
    group_size: int = 1
    packing_style: str = "balanced"


class TripPlanResponse(BaseModel):
    itinerary_text: str
    flights: List[Dict[str, Any]]
    hotels: List[Dict[str, Any]]
    activities: List[Dict[str, Any]]
    packing_list: Dict[str, Any]
    safety_alerts: List[Dict[str, Any]]
    trade_off_scores: Dict[str, Any]
    approved: bool
    errors: List[str]


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "editor"


class ExpenseCreate(BaseModel):
    description: str
    amount: float
    currency: str = "USD"
    paid_by_user_id: UUID


class ExpenseResponse(BaseModel):
    id: UUID
    description: Optional[str]
    amount: float
    currency: str
    paid_by_user_id: UUID
    incurred_at: datetime

    class Config:
        from_attributes = True


class ItineraryItemCreate(BaseModel):
    item_type: str = Field(..., pattern="^(flight|hotel|activity|transit)$")
    title: str
    start_time: datetime
    end_time: datetime
    total_cost: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
