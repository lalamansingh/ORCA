"""Strict contracts used by the deterministic ORCA risk engine and API."""

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertType, ProviderAvailability
from app.schemas.evidence import DataFreshness, EvidenceItem, Location


class RiskLevel(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREME = "EXTREME"
    UNAVAILABLE = "UNAVAILABLE"


class RiskFactorSeverity(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class RiskFactorType(StrEnum):
    WAVE_HEIGHT = "WAVE_HEIGHT"
    SWELL = "SWELL"
    WIND = "WIND"
    WIND_GUST = "WIND_GUST"
    VISIBILITY = "VISIBILITY"
    PRECIPITATION = "PRECIPITATION"
    LIGHTNING = "LIGHTNING"
    CYCLONE = "CYCLONE"
    HIGH_WAVE_ALERT = "HIGH_WAVE_ALERT"
    STORM_SURGE = "STORM_SURGE"
    OCEAN_CURRENT = "OCEAN_CURRENT"
    DATA_QUALITY = "DATA_QUALITY"
    OTHER = "OTHER"


class RiskCategory(StrEnum):
    SEA_STATE = "SEA_STATE"
    WIND = "WIND"
    VISIBILITY_WEATHER = "VISIBILITY_WEATHER"
    OCEAN_CURRENT = "OCEAN_CURRENT"
    OFFICIAL_ALERTS = "OFFICIAL_ALERTS"


class RiskDataQuality(StrEnum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    LIMITED = "LIMITED"
    POOR = "POOR"
    INSUFFICIENT = "INSUFFICIENT"


class RiskProvenanceMode(StrEnum):
    LIVE = "LIVE"
    DEMO = "DEMO"
    MIXED = "MIXED"
    UNAVAILABLE = "UNAVAILABLE"


class RiskSourceMetadata(BaseModel):
    provider: str
    dataset: str
    source_url: str | None = None
    status: str | None = None
    retrieved_at: datetime | None = None
    source_type: AlertSourceType | None = None


class RiskAlertInput(BaseModel):
    id: UUID
    type: AlertType
    severity: AlertSeverity
    title: str
    source: str
    provider: str
    source_url: str | None = None
    source_type: AlertSourceType
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    issued_at: datetime | None = None
    retrieved_at: datetime
    distance_km: float | None = None
    is_inside: bool | None = None


class MarineRiskInput(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    assessment_time: datetime
    wave_height_m: float | None = None
    wave_period_s: float | None = None
    swell_height_m: float | None = None
    swell_period_s: float | None = None
    wind_speed_kmh: float | None = None
    wind_gust_kmh: float | None = None
    visibility_km: float | None = None
    precipitation_mm: float | None = None
    weather_code: int | None = None
    ocean_current_speed_mps: float | None = None
    weather_observed_at: datetime | None = None
    marine_observed_at: datetime | None = None
    weather_retrieved_at: datetime | None = None
    marine_retrieved_at: datetime | None = None
    alerts: list[RiskAlertInput] = Field(default_factory=list)
    data_availability: dict[str, bool] = Field(default_factory=dict)
    data_freshness: dict[str, DataFreshness] = Field(default_factory=dict)
    sources: list[RiskSourceMetadata] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    provenance_mode: RiskProvenanceMode = RiskProvenanceMode.UNAVAILABLE
    limitations: list[str] = Field(default_factory=list)


class RiskFactor(BaseModel):
    type: RiskFactorType
    category: RiskCategory
    label: str
    observed_value: float | str | None = None
    unit: str | None = None
    severity: RiskFactorSeverity
    score_contribution: int = Field(ge=0, le=100)
    reason: str
    source: str
    source_url: str | None = None
    observed_at: datetime | None = None
    alert_id: UUID | None = None


class MarineRiskAssessment(BaseModel):
    score: int | None = Field(default=None, ge=0, le=100)
    level: RiskLevel
    assessment_time: datetime
    location: Location
    recommendation: str
    summary: str
    factors: list[RiskFactor] = Field(default_factory=list)
    critical_factors: list[RiskFactor] = Field(default_factory=list)
    data_quality: RiskDataQuality
    missing_inputs: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    sources: list[RiskSourceMetadata] = Field(default_factory=list)
    provenance_mode: RiskProvenanceMode
    risk_model_version: str
    calculated_at: datetime
    limitations: list[str] = Field(default_factory=list)


class RiskEvaluationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    assessment_time: datetime | None = None
    refresh: bool = False
    persist: bool = False

    @field_validator("assessment_time")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("assessment_time must include a timezone offset")
        return value


class RiskTimelinePoint(BaseModel):
    assessment_time: datetime
    score: int | None = Field(default=None, ge=0, le=100)
    level: RiskLevel
    data_quality: RiskDataQuality
    critical_factors: list[str] = Field(default_factory=list)


class RiskTimelineResponse(BaseModel):
    location: Location
    generated_at: datetime
    hours: int
    interval_hours: int
    risk_model_version: str
    points: list[RiskTimelinePoint]
    limitations: list[str] = Field(default_factory=list)


class RiskAssessmentRecordRead(BaseModel):
    id: UUID
    latitude: float
    longitude: float
    assessment_time: datetime
    score: int | None
    level: RiskLevel
    risk_model_version: str
    data_quality: RiskDataQuality
    provenance_mode: RiskProvenanceMode
    factors: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    created_at: datetime


class AlertCollectionState(BaseModel):
    available: bool
    status: str
    provider_statuses: list[ProviderAvailability] = Field(default_factory=list)
