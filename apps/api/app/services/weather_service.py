import time
from datetime import datetime

from app.providers.errors import ProviderError
from app.providers.weather.base import WeatherProvider
from app.schemas.weather import WeatherResponse
from app.services.data_source_logger import DataSourceLogger
from app.services.forecast_cache import TTLCache, forecast_cache_key
from app.services.provider_status import ProviderStatusRegistry


class WeatherService:
    def __init__(self, provider: WeatherProvider, cache: TTLCache, ttl: int, data_logger: DataSourceLogger, status_registry: ProviderStatusRegistry) -> None:
        self.provider, self.cache, self.ttl, self.data_logger, self.status_registry = provider, cache, ttl, data_logger, status_registry

    async def get_conditions(self, latitude: float, longitude: float, timezone: str = "auto", target_time: datetime | None = None, refresh: bool = False) -> WeatherResponse:
        key = "weather:" + forecast_cache_key(self.provider.name, latitude, longitude, timezone, target_time.isoformat() if target_time else None)
        if not refresh and (cached := await self.cache.get(key)) is not None:
            return cached  # type: ignore[return-value]
        started = time.perf_counter()
        try:
            result = await self.provider.get_conditions(latitude, longitude, timezone, target_time)
        except ProviderError as exc:
            code = type(exc).__name__
            self.status_registry.failure("weather", code)
            await self.data_logger.record(self.provider.name, "forecast", "failure", (time.perf_counter() - started) * 1000, code, {"timezone": timezone})
            raise
        self.status_registry.success("weather")
        await self.data_logger.record(self.provider.name, "forecast", "success", (time.perf_counter() - started) * 1000, None, {"timezone": timezone})
        await self.cache.set(key, result, self.ttl)
        return result
