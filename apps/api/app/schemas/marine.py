from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.evidence import DataFreshness, DataSource, EvidenceItem, Location, Measurement

MARINE_DECISION_SUPPORT_LIMITATION = "Forecast/model data is provided for decision support and should not be used as the sole source for navigation or emergency decisions."
COASTAL_MODEL_LIMITATION = "Marine model, tide, and current accuracy can be limited near coasts and is not suitable as certified coastal navigation information."


class MarineConditions(BaseModel):
    observed_at: datetime
    wave_height: Measurement | None = None
    wave_direction: Measurement | None = None
    wave_period: Measurement | None = None
    wave_peak_period: Measurement | None = None
    wind_wave_height: Measurement | None = None
    wind_wave_direction: Measurement | None = None
    wind_wave_period: Measurement | None = None
    swell_height: Measurement | None = None
    swell_direction: Measurement | None = None
    swell_period: Measurement | None = None
    sea_surface_temperature: Measurement | None = None
    ocean_current_speed: Measurement | None = None
    ocean_current_direction: Measurement | None = None
    sea_level_height: Measurement | None = None


class MarineForecastPoint(MarineConditions):
    pass


class MarineDailySummary(BaseModel):
    date: str
    wave_height_max: Measurement | None = None
    wave_direction_dominant: Measurement | None = None
    wave_period_max: Measurement | None = None
    swell_height_max: Measurement | None = None


class MarineResponse(BaseModel):
    location: Location
    current: MarineConditions | None
    hourly: list[MarineForecastPoint] = Field(default_factory=list)
    daily: list[MarineDailySummary] = Field(default_factory=list)
    timezone: str
    source: DataSource
    retrieved_at: datetime
    freshness: DataFreshness = DataFreshness.CURRENT
    evidence: list[EvidenceItem] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
