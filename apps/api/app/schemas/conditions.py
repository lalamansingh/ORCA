from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.evidence import DataSource, Location
from app.schemas.marine import MarineResponse
from app.schemas.weather import WeatherResponse


class CombinedConditionsResponse(BaseModel):
    location: Location
    weather: WeatherResponse | None = None
    marine: MarineResponse | None = None
    sources: list[DataSource] = Field(default_factory=list)
    retrieved_at: datetime
    status: Literal["complete", "partial", "unavailable"]
    errors: dict[str, str] = Field(default_factory=dict)
