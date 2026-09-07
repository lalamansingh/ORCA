"""Normalized API and provider contracts for marine safety alerts."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.domain.alerts import AlertFreshness, AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.schemas.evidence import Location
from app.schemas.geojson import GeoJSONGeometry, LineStringGeometry


def _plain_text(value: str | None, limit: int) -> str | None:
    if value is None:
        return None
    value = " ".join(value.replace("\x00", " ").split())
    return value[:limit] or None


class AlertEvidence(BaseModel):
    source: str
    bulletin: str | None = None
    issued_at: datetime | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    retrieved_at: datetime
    provider_url: HttpUrl | None = None


class CycloneDetails(BaseModel):
    storm_name: str | None = None
    classification: str | None = None
    center_latitude: float | None = Field(default=None, ge=-90, le=90)
    center_longitude: float | None = Field(default=None, ge=-180, le=180)
    movement_direction: str | None = None
    movement_speed: str | None = None
    maximum_sustained_wind: str | None = None
    central_pressure: str | None = None


class CycloneForecastPoint(BaseModel):
    forecast_time: datetime
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    wind_speed: str | None = None
    classification: str | None = None
    uncertainty: str | None = None


class NormalizedMarineAlert(BaseModel):
    external_id: str = Field(min_length=1, max_length=255)
    type: AlertType
    severity: AlertSeverity
    title: str = Field(min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=1000)
    description: str | None = Field(default=None, max_length=12000)
    affected_area: str | None = Field(default=None, max_length=1000)
    geometry: GeoJSONGeometry | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float | None = Field(default=None, gt=0, le=2000)
    forecast_track: LineStringGeometry | None = None
    forecast_points: list[CycloneForecastPoint] = Field(default_factory=list, max_length=100)
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    issued_at: datetime | None = None
    updated_at: datetime | None = None
    retrieved_at: datetime
    source: str = Field(min_length=1, max_length=255)
    source_url: HttpUrl | None = None
    provider: str = Field(min_length=1, max_length=100)
    status: AlertStatus
    source_type: AlertSourceType
    instructions: list[str] = Field(default_factory=list, max_length=30)
    evidence: AlertEvidence
    metadata: dict[str, object] = Field(default_factory=dict)
    cyclone: CycloneDetails | None = None

    @field_validator("title", "summary", "description", "affected_area", mode="before")
    @classmethod
    def sanitize_text(cls, value: object, info):  # type: ignore[no-untyped-def]
        limits = {"title": 255, "summary": 1000, "description": 12000, "affected_area": 1000}
        return _plain_text(str(value), limits[info.field_name]) if value is not None else None

    @field_validator("instructions", mode="before")
    @classmethod
    def sanitize_instructions(cls, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [text for item in value[:30] if (text := _plain_text(str(item), 1000))]


class MarineAlertRead(NormalizedMarineAlert):
    id: UUID
    created_at: datetime | None = None
    distance_km: float | None = None
    is_inside: bool | None = None
    nearest_point: Location | None = None
    freshness: AlertFreshness


class AlertProviderSource(BaseModel):
    provider: str
    status: ProviderAvailability
    source_url: HttpUrl | None = None
    retrieved_at: datetime
    alert_count: int = 0
    message: str | None = None


class AlertSummary(BaseModel):
    critical: int = 0
    severe: int = 0
    warning: int = 0
    watch: int = 0
    info: int = 0
    highest_severity: AlertSeverity | None = None


class AlertListResponse(BaseModel):
    location: Location
    status: Literal["complete", "partial", "unavailable"]
    result_state: Literal["ALERTS_AVAILABLE", "NO_ACTIVE_ALERTS", "NO_ALERTS_FOUND", "PROVIDER_UNAVAILABLE"]
    alerts: list[MarineAlertRead]
    summary: AlertSummary
    sources: list[AlertProviderSource]
    retrieved_at: datetime
    limitations: list[str] = Field(default_factory=list)


class AlertSubscriptionCreate(BaseModel):
    saved_location_id: UUID | None = None
    alert_type: AlertType
    minimum_severity: AlertSeverity = AlertSeverity.WARNING
    radius_km: float | None = Field(default=100, gt=0, le=2000)
    is_active: bool = True


class AlertSubscriptionUpdate(BaseModel):
    saved_location_id: UUID | None = None
    alert_type: AlertType | None = None
    minimum_severity: AlertSeverity | None = None
    radius_km: float | None = Field(default=None, gt=0, le=2000)
    is_active: bool | None = None


class AlertSubscriptionRead(AlertSubscriptionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime
