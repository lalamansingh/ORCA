from datetime import UTC, datetime, timedelta

import pytest

from app.risk.config import DEFAULT_RISK_CONFIG
from app.risk.engine import MarineRiskEngine
from app.risk.models import RiskLevel
from app.schemas.alerts import AlertListResponse, AlertProviderSource, AlertSummary
from app.schemas.evidence import DataSource, Location, Measurement
from app.schemas.marine import MarineConditions, MarineForecastPoint, MarineResponse
from app.schemas.weather import WeatherConditions, WeatherForecastPoint, WeatherResponse
from app.domain.alerts import ProviderAvailability
from app.services.risk_service import RiskRequestError, RiskService


class FakeConditionsService:
    def __init__(self, result):  # type: ignore[no-untyped-def]
        self.result = result
        self.calls: list[tuple[tuple[object, ...], dict[str, object]]] = []

    async def get_conditions(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        self.calls.append((args, kwargs))
        if isinstance(self.result, BaseException):
            raise self.result
        return self.result


class FakeAlertService:
    def __init__(self, result: AlertListResponse | BaseException) -> None:
        self.result = result
        self.calls: list[dict[str, object]] = []

    async def list_alerts(self, **kwargs):  # type: ignore[no-untyped-def]
        self.calls.append(kwargs)
        if isinstance(self.result, BaseException):
            raise self.result
        return self.result


def responses(now: datetime) -> tuple[WeatherResponse, MarineResponse, AlertListResponse]:
    location = Location(latitude=13.08, longitude=80.27)
    weather_source = DataSource(provider="Weather Test", dataset="Weather Forecast")
    marine_source = DataSource(provider="Marine Test", dataset="Marine Forecast")
    weather_points = [WeatherForecastPoint(observed_at=now + timedelta(hours=hour), wind_speed=Measurement(value=12 + hour, unit="km/h"), wind_gust=Measurement(value=18 + hour, unit="km/h"), visibility=Measurement(value=20, unit="km"), precipitation=Measurement(value=0, unit="mm"), weather_code=1) for hour in range(49)]
    marine_points = [MarineForecastPoint(observed_at=now + timedelta(hours=hour), wave_height=Measurement(value=0.5 + hour / 20, unit="m"), swell_height=Measurement(value=0.4, unit="m"), swell_period=Measurement(value=7, unit="s"), ocean_current_speed=Measurement(value=0.2, unit="m/s")) for hour in range(49)]
    weather = WeatherResponse(location=location, current=WeatherConditions(**weather_points[0].model_dump()), hourly=weather_points, timezone="UTC", source=weather_source, retrieved_at=now)
    marine = MarineResponse(location=location, current=MarineConditions(**marine_points[0].model_dump()), hourly=marine_points, timezone="UTC", source=marine_source, retrieved_at=now)
    alerts = AlertListResponse(location=location, status="complete", result_state="NO_ACTIVE_ALERTS", alerts=[], summary=AlertSummary(), sources=[AlertProviderSource(provider="Alert Test", status=ProviderAvailability.OPERATIONAL, retrieved_at=now)], retrieved_at=now)
    return weather, marine, alerts


def service(weather, marine, alerts) -> RiskService:  # type: ignore[no-untyped-def]
    return RiskService(FakeConditionsService(weather), FakeConditionsService(marine), FakeAlertService(alerts), MarineRiskEngine(), DEFAULT_RISK_CONFIG, None)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_provider_partial_failure_returns_unavailable_not_low() -> None:
    now = datetime.now(UTC).replace(microsecond=0)
    weather, _, alerts = responses(now)
    assessment = await service(weather, RuntimeError("marine unavailable"), alerts).evaluate(latitude=13.08, longitude=80.27)
    assert assessment.level == RiskLevel.UNAVAILABLE
    assert assessment.score is None
    assert "wave_height_m" in assessment.missing_inputs


@pytest.mark.asyncio
async def test_alert_provider_failure_is_visible_in_quality_without_erasing_environmental_score() -> None:
    now = datetime.now(UTC).replace(microsecond=0)
    weather, marine, _ = responses(now)
    assessment = await service(weather, marine, RuntimeError("alerts unavailable")).evaluate(latitude=13.08, longitude=80.27)
    assert assessment.level == RiskLevel.LOW
    assert assessment.score == 0
    assert assessment.data_quality.value == "LIMITED"
    assert any("Alerts provider: unavailable" in item for item in assessment.limitations)


@pytest.mark.asyncio
async def test_future_assessment_passes_target_to_providers_and_uses_future_point() -> None:
    now = datetime.now(UTC).replace(microsecond=0)
    weather, marine, alerts = responses(now)
    risk_service = service(weather, marine, alerts)
    target = now + timedelta(hours=6)
    assessment = await risk_service.evaluate(latitude=13.08, longitude=80.27, assessment_time=target)
    weather_call = risk_service.weather.calls[0][0]  # type: ignore[attr-defined]
    marine_call = risk_service.marine.calls[0][0]  # type: ignore[attr-defined]
    assert weather_call[3] == target and marine_call[3] == target
    assert assessment.assessment_time == target
    assert next(item for item in assessment.factors if item.type.value == "WAVE_HEIGHT").observed_value == 0.8


@pytest.mark.asyncio
async def test_timeline_fetches_each_provider_once_then_evaluates_locally() -> None:
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    weather, marine, alerts = responses(now)
    risk_service = service(weather, marine, alerts)
    timeline = await risk_service.timeline(latitude=13.08, longitude=80.27, hours=24, interval_hours=3)
    assert len(risk_service.weather.calls) == 1  # type: ignore[attr-defined]
    assert len(risk_service.marine.calls) == 1  # type: ignore[attr-defined]
    assert len(risk_service.alerts.calls) == 1  # type: ignore[attr-defined]
    assert len(timeline.points) == 9
    assert timeline.risk_model_version == "orca-risk-v1"


@pytest.mark.asyncio
async def test_future_horizon_is_bounded() -> None:
    now = datetime.now(UTC)
    weather, marine, alerts = responses(now)
    with pytest.raises(RiskRequestError):
        await service(weather, marine, alerts).evaluate(latitude=13.08, longitude=80.27, assessment_time=now + timedelta(hours=49))
