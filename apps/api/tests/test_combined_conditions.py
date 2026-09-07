from datetime import UTC, datetime

import pytest

from app.providers.errors import DataUnavailableError
from app.schemas.evidence import DataSource, Location
from app.schemas.marine import MarineResponse
from app.schemas.weather import WeatherResponse
from app.services.combined_conditions_service import CombinedConditionsService


NOW = datetime.now(UTC)
SOURCE = DataSource(provider="test", dataset="test")


class FakeService:
    def __init__(self, result):
        self.result = result

    async def get_conditions(self, *_args, **_kwargs):
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.mark.asyncio
async def test_combined_conditions_complete() -> None:
    weather = WeatherResponse(location=Location(latitude=13, longitude=80), current=None, timezone="UTC", source=SOURCE, retrieved_at=NOW)
    marine = MarineResponse(location=Location(latitude=13, longitude=80), current=None, timezone="UTC", source=SOURCE, retrieved_at=NOW)
    result = await CombinedConditionsService(FakeService(weather), FakeService(marine)).get_conditions(13, 80)
    assert result.status == "complete" and len(result.sources) == 2


@pytest.mark.asyncio
async def test_combined_conditions_keeps_weather_when_marine_unavailable() -> None:
    weather = WeatherResponse(location=Location(latitude=13, longitude=80), current=None, timezone="UTC", source=SOURCE, retrieved_at=NOW)
    result = await CombinedConditionsService(FakeService(weather), FakeService(DataUnavailableError("Marine conditions are unavailable for this location."))).get_conditions(13, 80)
    assert result.status == "partial" and result.weather and result.marine is None
    assert "marine" in result.errors


@pytest.mark.asyncio
async def test_combined_conditions_reports_complete_failure() -> None:
    error = DataUnavailableError("unavailable")
    result = await CombinedConditionsService(FakeService(error), FakeService(error)).get_conditions(13, 80)
    assert result.status == "unavailable" and result.weather is None and result.marine is None
