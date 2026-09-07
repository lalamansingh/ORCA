from abc import ABC, abstractmethod
from datetime import datetime

from app.schemas.marine import MarineResponse


class MarineWeatherProvider(ABC):
    name: str

    @abstractmethod
    async def get_conditions(self, latitude: float, longitude: float, timezone: str, target_time: datetime | None = None) -> MarineResponse:
        raise NotImplementedError
