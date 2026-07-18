import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, Numeric, Float,
    ForeignKey, CheckConstraint, UniqueConstraint, Index,
    TypeDecorator,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from .database import Base, is_sqlite


class GUID(TypeDecorator):
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    owned_trips = relationship("Trip", back_populates="owner")
    memberships = relationship("TripMember", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="paid_by_user")
    expense_splits = relationship("ExpenseSplit", back_populates="user")
    packing_assignments = relationship("PackingListItem", back_populates="assigned_user")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(150), nullable=False)
    destination = Column(String(100), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    budget = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    owner_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="chk_date_logic"),
    )

    owner = relationship("User", back_populates="owned_trips")
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")
    packing_list = relationship("PackingListItem", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")


class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, default="viewer")
    joined_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_trip_user_pairing"),
    )

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="memberships")


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_cost = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        CheckConstraint("end_time >= start_time", name="chk_time_logic"),
        Index("idx_itinerary_trip_start", "trip_id", "start_time"),
    )

    trip = relationship("Trip", back_populates="itinerary_items")
    flight_segment = relationship("FlightSegment", uselist=False, back_populates="itinerary_item", cascade="all, delete-orphan")
    lodging = relationship("LodgingReservation", uselist=False, back_populates="itinerary_item", cascade="all, delete-orphan")
    activity_booking = relationship("ActivityBooking", uselist=False, back_populates="itinerary_item", cascade="all, delete-orphan")


class FlightSegment(Base):
    __tablename__ = "flight_segments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    item_id = Column(GUID(), ForeignKey("itinerary_items.id", ondelete="CASCADE"), nullable=False)
    carrier_code = Column(String(10), nullable=False)
    flight_number = Column(String(15), nullable=False)
    origin_airport = Column(String(10), nullable=False)
    destination_airport = Column(String(10), nullable=False)
    reservation_code = Column(String(50), nullable=True)
    seat_assignment = Column(String(20), nullable=True)

    __table_args__ = (
        UniqueConstraint("item_id", name="uq_flight_segment"),
    )

    itinerary_item = relationship("ItineraryItem", back_populates="flight_segment")


class LodgingReservation(Base):
    __tablename__ = "lodging_reservations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    item_id = Column(GUID(), ForeignKey("itinerary_items.id", ondelete="CASCADE"), nullable=False)
    property_name = Column(String(150), nullable=False)
    address = Column(Text, nullable=True)
    confirmation_number = Column(String(100), nullable=True)
    room_type = Column(String(100), nullable=True)
    phone_number = Column(String(50), nullable=True)

    __table_args__ = (
        UniqueConstraint("item_id", name="uq_lodging_res"),
    )

    itinerary_item = relationship("ItineraryItem", back_populates="lodging")


class ActivityBooking(Base):
    __tablename__ = "activity_bookings"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    item_id = Column(GUID(), ForeignKey("itinerary_items.id", ondelete="CASCADE"), nullable=False)
    provider_name = Column(String(150), nullable=False)
    ticket_reference = Column(String(100), nullable=True)
    meeting_point = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("item_id", name="uq_activity_booking"),
    )

    itinerary_item = relationship("ItineraryItem", back_populates="activity_booking")


class PackingListItem(Base):
    __tablename__ = "packing_lists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False, default="clothing")
    quantity = Column(Integer, nullable=False, default=1)
    is_packed = Column(Boolean, nullable=False, default=False)
    assigned_to_user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    weather_triggered = Column(Boolean, nullable=False, default=False)
    bag_allocation = Column(String(100), default="carry_on")

    __table_args__ = (
        Index("idx_packing_trip_lookup", "trip_id"),
    )

    trip = relationship("Trip", back_populates="packing_list")
    assigned_user = relationship("User", back_populates="packing_assignments")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    paid_by_user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    description = Column(String(255), nullable=True)
    incurred_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        Index("idx_expense_trip_lookup", "trip_id"),
    )

    trip = relationship("Trip", back_populates="expenses")
    paid_by_user = relationship("User", back_populates="expenses_paid")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    expense_id = Column(GUID(), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    split_amount = Column(Numeric(10, 2), nullable=False)
    is_settled = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("expense_id", "user_id", name="uq_expense_user_split"),
        Index("idx_expense_splits_user", "user_id", "is_settled"),
    )

    expense = relationship("Expense", back_populates="splits")
    user = relationship("User", back_populates="expense_splits")
