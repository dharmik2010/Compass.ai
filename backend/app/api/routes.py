import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.database import get_db
from ..db.models import User, Trip, TripMember, ItineraryItem, PackingListItem, Expense, ExpenseSplit
from ..agents.graph import travel_planner
from ..agents.state import TripState
from ..agents.multilingual_agent import multilingual_agent
from ..ingestion.social_video_parser import social_ingestion_engine
from ..ingestion.email_parser import email_harvester
from .models import (
    UserCreate, UserResponse, TokenResponse, TripCreate, TripResponse,
    TripDetailResponse, TripPlanRequest, TripPlanResponse,
    InviteMemberRequest, ExpenseCreate, ExpenseResponse, ItineraryItemCreate,
)


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "es"
    source_lang: str = "en"


class DisruptionRequest(BaseModel):
    disruption_type: str = "flight_delay"
    details: str = ""
    user_lang: str = "en"


class SocialVideoRequest(BaseModel):
    url: str


class EmailParseRequest(BaseModel):
    raw_email: str


router = APIRouter()


@router.post("/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    from passlib.hash import bcrypt
    user = User(
        email=payload.email,
        password_hash=bcrypt.hash(payload.password),
        name=payload.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    from passlib.hash import bcrypt
    if not bcrypt.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    from ..config import settings
    from jose import jwt
    token = jwt.encode(
        {"sub": str(user.id), "email": user.email},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return TokenResponse(access_token=token)


@router.post("/trips", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, db: AsyncSession = Depends(get_db)):
    trip = Trip(
        title=payload.title,
        destination=payload.destination,
        start_date=datetime.combine(payload.start_date, datetime.min.time()),
        end_date=datetime.combine(payload.end_date, datetime.min.time()),
        budget=payload.budget,
        owner_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.get("/trips", response_model=List[TripResponse])
async def list_trips(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trip).order_by(Trip.created_at.desc()))
    return result.scalars().all()


@router.get("/trips/{trip_id}", response_model=TripDetailResponse)
async def get_trip(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip


@router.post("/plan", response_model=TripPlanResponse)
async def plan_trip(payload: TripPlanRequest):
    config = {"configurable": {"thread_id": str(uuid.uuid4())}}

    initial_state: TripState = {
        "messages": [],
        "destination": payload.destination,
        "origin": payload.origin,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "budget": payload.budget,
        "interests": payload.interests,
        "group_size": payload.group_size,
        "packing_style": payload.packing_style,
        "flights": [],
        "hotels": [],
        "activities": [],
        "errors": [],
        "itinerary_draft": "",
        "approved": False,
        "packing_list": {},
        "safety_alerts": [],
        "trade_off_scores": {},
    }

    try:
        result = travel_planner.invoke(initial_state, config=config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planning failed: {str(e)}")

    return TripPlanResponse(
        itinerary_text=result.get("itinerary_draft", ""),
        flights=result.get("flights", []),
        hotels=result.get("hotels", []),
        activities=result.get("activities", []),
        packing_list=result.get("packing_list", {}),
        safety_alerts=result.get("safety_alerts", []),
        trade_off_scores=result.get("trade_off_scores", {}),
        approved=result.get("approved", False),
        errors=result.get("errors", []),
    )


@router.post("/trips/{trip_id}/approve")
async def approve_itinerary(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"status": "approved", "trip_id": str(trip_id)}


@router.post("/trips/{trip_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_member(trip_id: uuid.UUID, payload: InviteMemberRequest, db: AsyncSession = Depends(get_db)):
    trip_result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    user_result = await db.execute(select(User).where(User.email == payload.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    member = TripMember(trip_id=trip_id, user_id=user.id, role=payload.role)
    db.add(member)
    await db.commit()
    return {"status": "invited", "user_id": str(user.id), "role": payload.role}


@router.post("/trips/{trip_id}/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def add_expense(trip_id: uuid.UUID, payload: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    expense = Expense(
        trip_id=trip_id,
        paid_by_user_id=payload.paid_by_user_id,
        amount=payload.amount,
        currency=payload.currency,
        description=payload.description,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.get("/trips/{trip_id}/expenses", response_model=List[ExpenseResponse])
async def list_expenses(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Expense).where(Expense.trip_id == trip_id).order_by(Expense.incurred_at.desc())
    )
    return result.scalars().all()


@router.post("/trips/{trip_id}/itinerary-items", status_code=status.HTTP_201_CREATED)
async def add_itinerary_item(trip_id: uuid.UUID, payload: ItineraryItemCreate, db: AsyncSession = Depends(get_db)):
    item = ItineraryItem(
        trip_id=trip_id,
        item_type=payload.item_type,
        title=payload.title,
        start_time=payload.start_time,
        end_time=payload.end_time,
        total_cost=payload.total_cost,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/ingest/social-video")
async def ingest_social_video(payload: SocialVideoRequest):
    result = await social_ingestion_engine.extract_pois_from_video(payload.url)
    if not result or ("pois" in result and not result["pois"]):
        return {"status": "no_pois_found", "data": result}

    pois = result.get("pois", [])
    vision_data = result.get("vision_data", {})

    return {
        "status": "success",
        "platform": result.get("platform"),
        "pois": pois,
        "vision_analysis": {
            "activities": vision_data.get("activities", []),
            "cuisine_type": vision_data.get("cuisine_type"),
            "crowd_level": vision_data.get("crowd_level"),
            "vibe": vision_data.get("vibe"),
        },
        "total_pois": len(pois),
    }


@router.post("/translate")
async def translate_text(payload: TranslateRequest):
    translation = await multilingual_agent.translate(
        payload.text, payload.target_lang, payload.source_lang
    )
    return {
        "original": payload.text,
        "translation": translation,
        "source_language": payload.source_lang,
        "target_language": payload.target_lang,
    }


@router.post("/translate/itinerary")
async def translate_itinerary(payload: TranslateRequest):
    translated = await multilingual_agent.translate_itinerary(
        payload.text, payload.target_lang
    )
    return {
        "translated_itinerary": translated,
        "language": payload.target_lang,
    }


@router.post("/disruption-handler")
async def handle_disruption(payload: DisruptionRequest):
    result = await multilingual_agent.handle_disruption(
        disruption_type=payload.disruption_type,
        details=payload.details or f"Disruption: {payload.disruption_type}",
        user_lang=payload.user_lang,
    )
    return result


@router.get("/emergency-phrases/{lang}")
async def get_emergency_phrases(lang: str = "en"):
    phrases = multilingual_agent.get_emergency_phrases(lang)
    return {"language": lang, "phrases": phrases}


@router.post("/email/parse")
async def parse_email(
    file: UploadFile = File(...),
):
    content = await file.read()
    result = await email_harvester.parse_email(content)
    return {
        "filename": file.filename,
        "parsed_items": result,
        "count": len(result),
    }


@router.post("/email/poll")
async def poll_email(
    email_address: str = Form(...),
    email_password: str = Form(...),
):
    items = await email_harvester.poll_inbox(email_address, email_password)
    return {"parsed_items": items, "count": len(items)}


@router.get("/email/trip-address/{trip_id}")
async def get_trip_email_address(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    email_addr = email_harvester._generate_trip_email_address(trip.title, trip.id)
    return {"email_address": email_addr, "domain": settings.email_domain}


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Travel Planner"}
