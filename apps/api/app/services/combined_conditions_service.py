import asyncio
from datetime import UTC, datetime

from app.providers.errors import ProviderError
from app.schemas.conditions import CombinedConditionsResponse
from app.schemas.evidence import Location
from app.services.marine_weather_service import MarineWeatherService
from app.services.weather_service import WeatherService


class CombinedConditionsService:
    def __init__(self, weather: WeatherService, marine: MarineWeatherService) -> None:
        self.weather, self.marine = weather, marine

    async def get_conditions(self, latitude: float, longitude: float, timezone: str = "auto", refresh: bool = False) -> CombinedConditionsResponse:
        results = await asyncio.gather(
            self.weather.get_conditions(latitude, longitude, timezone, refresh=refresh),
            self.marine.get_conditions(latitude, longitude, timezone, refresh=refresh),
            return_exceptions=True,
        )
        weather = None if isinstance(results[0], BaseException) else results[0]
        marine = None if isinstance(results[1], BaseException) else results[1]
        errors = {}
        if isinstance(results[0], BaseException):
            errors["weather"] = _safe_error(results[0])
        if isinstance(results[1], BaseException):
            errors["marine"] = _safe_error(results[1])
        status = "complete" if weather and marine else "partial" if weather or marine else "unavailable"
        sources = [response.source for response in (weather, marine) if response is not None]
        return CombinedConditionsResponse(location=Location(latitude=latitude, longitude=longitude), weather=weather, marine=marine, sources=sources, retrieved_at=datetime.now(UTC), status=status, errors=errors)


def _safe_error(error: BaseException) -> str:
    return str(error) if isinstance(error, ProviderError) else "Forecast service is unavailable."
