from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.domain.alerts import AlertFreshness, AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.risk.config import DEFAULT_RISK_CONFIG
from app.risk.input_builder import RiskInputBuilder
from app.risk.models import RiskProvenanceMode
from app.schemas.alerts import AlertEvidence, AlertListResponse, AlertProviderSource, AlertSummary, MarineAlertRead
from app.schemas.evidence import DataFreshness, DataSource, Location, Measurement
from app.schemas.marine import MarineConditions, MarineForecastPoint, MarineResponse
from app.schemas.weather import WeatherConditions, WeatherForecastPoint, WeatherResponse

NOW = datetime(2026, 9, 7, 6, tzinfo=UTC)
LOCATION = Location(latitude=13.08, longitude=80.27)
WEATHER_SOURCE = DataSource(provider="Weather Provider", dataset="Weather Forecast", source_url="https://weather.example")
MARINE_SOURCE = DataSource(provider="Marine Provider", dataset="Marine Forecast", source_url="https://marine.example")


def weather_response(*, retrieved_at: datetime = NOW) -> WeatherResponse:
    current = WeatherConditions(observed_at=NOW, wind_speed=Measurement(value=12, unit="km/h"), wind_gust=Measurement(value=18, unit="km/h"), visibility=Measurement(value=20, unit="km"), precipitation=Measurement(value=0, unit="mm"), weather_code=1)
    future = WeatherForecastPoint(observed_at=NOW + timedelta(hours=6), wind_speed=Measurement(value=55, unit="km/h"), wind_gust=Measurement(value=70, unit="km/h"), visibility=Measurement(value=3, unit="km"), precipitation=Measurement(value=8, unit="mm"), weather_code=95)
    return WeatherResponse(location=LOCATION, current=current, hourly=[WeatherForecastPoint(**current.model_dump()), future], timezone="UTC", source=WEATHER_SOURCE, retrieved_at=retrieved_at)


def marine_response(*, retrieved_at: datetime = NOW) -> MarineResponse:
    current = MarineConditions(observed_at=NOW, wave_height=Measurement(value=0.5, unit="m"), wave_period=Measurement(value=6, unit="s"), swell_height=Measurement(value=0.4, unit="m"), swell_period=Measurement(value=7, unit="s"), ocean_current_speed=Measurement(value=0.2, unit="m/s"))
    future = MarineForecastPoint(observed_at=NOW + timedelta(hours=6), wave_height=Measurement(value=3, unit="m"), wave_period=Measurement(value=9, unit="s"), swell_height=Measurement(value=2, unit="m"), swell_period=Measurement(value=13, unit="s"), ocean_current_speed=Measurement(value=1.2, unit="m/s"))
    return MarineResponse(location=LOCATION, current=current, hourly=[MarineForecastPoint(**current.model_dump()), future], timezone="UTC", source=MARINE_SOURCE, retrieved_at=retrieved_at)


def alert_response(*, spatial: bool = True, source_type: AlertSourceType = AlertSourceType.OFFICIAL_ADVISORY) -> AlertListResponse:
    item = MarineAlertRead(
        id=uuid4(), external_id="alert-1", type=AlertType.HIGH_WAVES, severity=AlertSeverity.WARNING,
        title="High-wave warning", summary=None, description=None, affected_area="Test area", geometry=None,
        latitude=None, longitude=None, radius_km=None, forecast_track=None, forecast_points=[],
        valid_from=NOW - timedelta(hours=1), valid_until=NOW + timedelta(hours=12), issued_at=NOW,
        updated_at=NOW, retrieved_at=NOW, source="Authority", source_url="https://alerts.example",
        provider="Demo Provider" if source_type == AlertSourceType.DEMO else "Official Provider",
        status=AlertStatus.ACTIVE, source_type=source_type, instructions=[],
        evidence=AlertEvidence(source="Authority", retrieved_at=NOW), metadata={}, cyclone=None,
        created_at=NOW, distance_km=5 if spatial else None, is_inside=spatial, nearest_point=None,
        freshness=AlertFreshness.CURRENT,
    )
    return AlertListResponse(
        location=LOCATION, status="complete", result_state="ALERTS_AVAILABLE", alerts=[item],
        summary=AlertSummary(warning=1, highest_severity=AlertSeverity.WARNING),
        sources=[AlertProviderSource(provider=item.provider, status=ProviderAvailability.DEMO if source_type == AlertSourceType.DEMO else ProviderAvailability.OPERATIONAL, retrieved_at=NOW, alert_count=1)],
        retrieved_at=NOW,
    )


def test_future_assessment_selects_forecast_points_not_current_values() -> None:
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW + timedelta(hours=6),
        weather=weather_response(), marine=marine_response(), alert_response=alert_response(),
        prefer_current=False, collected_at=NOW,
    )
    assert item.wind_speed_kmh == 55
    assert item.wave_height_m == 3
    assert item.weather_observed_at == NOW + timedelta(hours=6)
    assert item.marine_observed_at == NOW + timedelta(hours=6)


def test_current_assessment_prefers_current_blocks() -> None:
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW,
        weather=weather_response(), marine=marine_response(), alert_response=alert_response(),
        prefer_current=True, collected_at=NOW,
    )
    assert item.wind_speed_kmh == 12
    assert item.wave_height_m == 0.5


def test_unmatched_future_point_remains_missing() -> None:
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW + timedelta(hours=12),
        weather=weather_response(), marine=marine_response(), alert_response=alert_response(),
        prefer_current=False, collected_at=NOW,
    )
    assert item.wind_speed_kmh is None and item.wave_height_m is None
    assert any("matched" in limitation for limitation in item.limitations)


def test_spatially_unverifiable_alert_is_not_applied() -> None:
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW,
        weather=weather_response(), marine=marine_response(), alert_response=alert_response(spatial=False),
        prefer_current=True, collected_at=NOW,
    )
    assert item.alerts == []
    assert any("provider geometry" in limitation for limitation in item.limitations)


def test_live_forecasts_plus_demo_alert_are_explicitly_mixed() -> None:
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW,
        weather=weather_response(), marine=marine_response(), alert_response=alert_response(source_type=AlertSourceType.DEMO),
        prefer_current=True, collected_at=NOW,
    )
    assert item.provenance_mode == RiskProvenanceMode.MIXED


def test_old_required_provider_data_is_marked_unavailable() -> None:
    old = NOW - timedelta(hours=13)
    item = RiskInputBuilder(DEFAULT_RISK_CONFIG).build(
        latitude=13.08, longitude=80.27, assessment_time=NOW,
        weather=weather_response(retrieved_at=old), marine=marine_response(retrieved_at=old), alert_response=alert_response(),
        prefer_current=True, collected_at=NOW,
    )
    assert item.data_freshness["weather"] == DataFreshness.UNAVAILABLE
    assert item.data_freshness["marine"] == DataFreshness.UNAVAILABLE
