from datetime import UTC, datetime

import pytest

from app.schemas.evidence import DataSource, Location
from app.schemas.weather import WeatherResponse
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry
from app.services.weather_service import WeatherService


class CountingProvider:
    name = "counting"
    calls = 0

    async def get_conditions(self, latitude, longitude, timezone, target_time=None):
        self.calls += 1
        return WeatherResponse(location=Location(latitude=latitude, longitude=longitude), current=None, timezone=timezone, source=DataSource(provider="test", dataset="test"), retrieved_at=datetime.now(UTC))


class NoopLogger:
    async def record(self, *_args, **_kwargs):
        return None


@pytest.mark.asyncio
async def test_weather_service_uses_coordinate_specific_cache() -> None:
    provider = CountingProvider()
    service = WeatherService(provider, TTLCache(), 600, NoopLogger(), ProviderStatusRegistry())
    first = await service.get_conditions(13.0, 80.35)
    second = await service.get_conditions(13.0, 80.35)
    await service.get_conditions(13.1, 80.35)
    assert first is second and provider.calls == 2


@pytest.mark.asyncio
async def test_manual_refresh_bypasses_cache() -> None:
    provider = CountingProvider()
    service = WeatherService(provider, TTLCache(), 600, NoopLogger(), ProviderStatusRegistry())
    await service.get_conditions(13.0, 80.35)
    await service.get_conditions(13.0, 80.35, refresh=True)
    assert provider.calls == 2
