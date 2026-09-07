from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.evidence import DataFreshness, DataSource, EvidenceItem, Location, Measurement


class WeatherConditions(BaseModel):
    observed_at: datetime
    temperature: Measurement | None = None
    apparent_temperature: Measurement | None = None
    humidity: Measurement | None = None
    precipitation: Measurement | None = None
    rain: Measurement | None = None
    visibility: Measurement | None = None
    wind_speed: Measurement | None = None
    wind_direction: Measurement | None = None
    wind_gust: Measurement | None = None
    weather_code: int | None = None
    weather_description: str | None = None
    cloud_cover: Measurement | None = None
    pressure: Measurement | None = None


class WeatherForecastPoint(WeatherConditions):
    pass


class WeatherResponse(BaseModel):
    location: Location
    current: WeatherConditions | None
    hourly: list[WeatherForecastPoint] = Field(default_factory=list)
    timezone: str
    source: DataSource
    retrieved_at: datetime
    freshness: DataFreshness = DataFreshness.CURRENT
    evidence: list[EvidenceItem] = Field(default_factory=list)
