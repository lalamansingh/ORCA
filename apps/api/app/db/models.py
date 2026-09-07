"""PostgreSQL/PostGIS ORM models. No authentication workflow is implemented here."""

from datetime import date, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType


class MessageRole(StrEnum): USER = "user"; ASSISTANT = "assistant"; SYSTEM = "system"
class LocationType(StrEnum): HOME_HARBOUR = "HOME_HARBOUR"; FISHING_HARBOUR = "FISHING_HARBOUR"; FISHING_SPOT = "FISHING_SPOT"; CUSTOM = "CUSTOM"
class Severity(StrEnum): LOW = "LOW"; MODERATE = "MODERATE"; HIGH = "HIGH"; CRITICAL = "CRITICAL"
class ZoneType(StrEnum): EEZ = "EEZ"; INTERNATIONAL_BOUNDARY = "INTERNATIONAL_BOUNDARY"; RESTRICTED_WATER = "RESTRICTED_WATER"; MARINE_PROTECTED_AREA = "MARINE_PROTECTED_AREA"; ECOLOGICALLY_SENSITIVE_ZONE = "ECOLOGICALLY_SENSITIVE_ZONE"; CUSTOM = "CUSTOM"

def postgres_enum(enum_class: type[StrEnum], name: str) -> Enum:
    return Enum(enum_class, name=name, values_callable=lambda enum: [member.value for member in enum])


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    password_hash: Mapped[str | None] = mapped_column(String(512))
    preferred_language: Mapped[str] = mapped_column(String(16), default="en")
    preferred_units: Mapped[str] = mapped_column(String(16), default="metric")
    default_latitude: Mapped[float | None] = mapped_column(Float)
    default_longitude: Mapped[float | None] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user")
    saved_locations: Mapped[list["SavedLocation"]] = relationship(back_populates="user")
    refresh_sessions: Mapped[list["RefreshTokenSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshTokenSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refresh_token_sessions"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    user: Mapped[User] = relationship(back_populates="refresh_sessions")


class Conversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "conversations"
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(16), default="en")
    context_summary: Mapped[str | None] = mapped_column(Text)
    user: Mapped[User | None] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class Message(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "messages"
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role: Mapped[MessageRole] = mapped_column(postgres_enum(MessageRole, "message_role"))
    content: Mapped[str] = mapped_column(Text)
    intent: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class SavedLocation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "saved_locations"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    location_type: Mapped[LocationType] = mapped_column(postgres_enum(LocationType, "location_type"))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    geometry: Mapped[Any] = mapped_column(Geometry("POINT", srid=4326, spatial_index=True))
    user: Mapped[User] = relationship(back_populates="saved_locations")


class MarineAlert(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "marine_alerts"
    external_id: Mapped[str] = mapped_column(String(255), index=True)
    alert_type: Mapped[AlertType] = mapped_column(postgres_enum(AlertType, "alert_type"), index=True)
    severity: Mapped[AlertSeverity] = mapped_column(postgres_enum(AlertSeverity, "alert_severity"), index=True)
    status: Mapped[AlertStatus] = mapped_column(postgres_enum(AlertStatus, "alert_status"), index=True)
    source_type: Mapped[AlertSourceType] = mapped_column(postgres_enum(AlertSourceType, "alert_source_type"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(String(1000))
    description: Mapped[str | None] = mapped_column(Text)
    affected_area: Mapped[str | None] = mapped_column(String(1000))
    geometry: Mapped[Any | None] = mapped_column(Geometry("GEOMETRY", srid=4326, spatial_index=True))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    radius_km: Mapped[float | None] = mapped_column(Float)
    forecast_track: Mapped[Any | None] = mapped_column(Geometry("LINESTRING", srid=4326, spatial_index=True))
    forecast_points: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    source: Mapped[str] = mapped_column(String(255), index=True)
    provider: Mapped[str] = mapped_column(String(100), index=True)
    source_url: Mapped[str | None] = mapped_column(String(2048))
    instructions: Mapped[list[str] | None] = mapped_column(JSONB)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    retrieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


class PotentialFishingZone(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "potential_fishing_zones"
    external_id: Mapped[str | None] = mapped_column(String(255), index=True)
    name: Mapped[str] = mapped_column(String(255))
    geometry: Mapped[Any] = mapped_column(Geometry("MULTIPOLYGON", srid=4326, spatial_index=True))
    centroid: Mapped[Any] = mapped_column(Geometry("POINT", srid=4326, spatial_index=True))
    source: Mapped[str] = mapped_column(String(255), index=True)
    advisory_date: Mapped[date | None] = mapped_column(Date)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confidence: Mapped[str | None] = mapped_column(String(32))
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


class MarineZone(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "marine_zones"
    name: Mapped[str] = mapped_column(String(255))
    zone_type: Mapped[ZoneType] = mapped_column(postgres_enum(ZoneType, "zone_type"), index=True)
    geometry: Mapped[Any] = mapped_column(Geometry("MULTIPOLYGON", srid=4326, spatial_index=True))
    source: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


class MarineRoute(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "marine_routes"
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    origin: Mapped[Any] = mapped_column(Geometry("POINT", srid=4326))
    destination: Mapped[Any] = mapped_column(Geometry("POINT", srid=4326))
    geometry: Mapped[Any] = mapped_column(Geometry("LINESTRING", srid=4326, spatial_index=True))
    distance_km: Mapped[float | None] = mapped_column(Float)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer)
    risk_score: Mapped[float | None] = mapped_column(Float)
    risk_level: Mapped[Severity | None] = mapped_column(postgres_enum(Severity, "route_risk_level"))
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


class AlertSubscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "alert_subscriptions"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    saved_location_id: Mapped[UUID | None] = mapped_column(ForeignKey("saved_locations.id", ondelete="SET NULL"), index=True)
    alert_type: Mapped[AlertType] = mapped_column(postgres_enum(AlertType, "subscription_alert_type"))
    minimum_severity: Mapped[AlertSeverity] = mapped_column(postgres_enum(AlertSeverity, "subscription_alert_severity"))
    radius_km: Mapped[float | None] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class MarineQueryLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "marine_query_logs"
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    conversation_id: Mapped[UUID | None] = mapped_column(ForeignKey("conversations.id", ondelete="SET NULL"), index=True)
    query: Mapped[str] = mapped_column(Text)
    intent: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), index=True)
    duration_ms: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class DataSourceLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "data_source_logs"
    provider: Mapped[str] = mapped_column(String(255), index=True)
    operation: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), index=True)
    latency_ms: Mapped[float | None] = mapped_column(Float)
    error_code: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None] = mapped_column(Text)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


Index("ix_pfz_validity", PotentialFishingZone.valid_from, PotentialFishingZone.valid_until)
Index("ix_alert_validity", MarineAlert.valid_from, MarineAlert.valid_until)
Index("uq_marine_alert_provider_external_id", MarineAlert.provider, MarineAlert.external_id, unique=True)
CheckConstraint("default_latitude BETWEEN -90 AND 90", name="user_default_latitude_range", table=User.__table__)
CheckConstraint("default_longitude BETWEEN -180 AND 180", name="user_default_longitude_range", table=User.__table__)
