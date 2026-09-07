from abc import ABC, abstractmethod
from datetime import datetime

from app.schemas.weather import WeatherResponse


class WeatherProvider(ABC):
    name: str

    @abstractmethod
    async def get_conditions(self, latitude: float, longitude: float, timezone: str, target_time: datetime | None = None) -> WeatherResponse:
        raise NotImplementedError
