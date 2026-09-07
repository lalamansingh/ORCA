"""Provider orchestration for deterministic marine risk assessments."""

import asyncio
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.risk.config import RiskEngineConfig
from app.risk.engine import MarineRiskEngine
from app.risk.input_builder import RiskInputBuilder
from app.risk.models import MarineRiskAssessment, RiskTimelinePoint, RiskTimelineResponse
from app.schemas.alerts import AlertListResponse
from app.schemas.evidence import Location
from app.schemas.marine import MarineResponse
from app.schemas.weather import WeatherResponse
from app.services.alert_service import AlertService
from app.services.marine_weather_service import MarineWeatherService
from app.services.weather_service import WeatherService


class RiskRequestError(ValueError):
    pass


class RiskService:
    def __init__(
        self, weather: WeatherService, marine: MarineWeatherService, alerts: AlertService,
        engine: MarineRiskEngine, config: RiskEngineConfig, session_factory: async_sessionmaker,
    ) -> None:
        self.weather = weather
        self.marine = marine
        self.alerts = alerts
        self.engine = engine
        self.config = config
        self.session_factory = session_factory
        self.builder = RiskInputBuilder(config)

    async def evaluate(
        self, *, latitude: float, longitude: float, assessment_time: datetime | None = None,
        refresh: bool = False, persist: bool = False, user_id: UUID | None = None,
    ) -> MarineRiskAssessment:
        now = datetime.now(UTC)
        target, prefer_current = self._target(assessment_time, now)
        weather, marine, alerts, errors = await self._collect(latitude, longitude, target if not prefer_current else None, refresh, target, prefer_current)
        risk_input = self.builder.build(
            latitude=latitude, longitude=longitude, assessment_time=target, weather=weather,
            marine=marine, alert_response=alerts, prefer_current=prefer_current,
            collected_at=now, collection_errors=errors,
        )
        assessment = self.engine.evaluate(risk_input, calculated_at=now)
        if persist:
            if user_id is None:
                raise RiskRequestError("Authentication is required to persist a risk assessment.")
            from app.repositories.risk_assessments import RiskAssessmentRepository
            async with self.session_factory() as session:
                await RiskAssessmentRepository(session).create(user_id, assessment)
        return assessment

    async def timeline(self, *, latitude: float, longitude: float, hours: int = 24, interval_hours: int = 3, refresh: bool = False) -> RiskTimelineResponse:
        if hours < 1 or hours > min(48, self.config.max_forecast_hours):
            raise RiskRequestError(f"hours must be between 1 and {min(48, self.config.max_forecast_hours)}")
        if interval_hours < 1 or interval_hours > 12:
            raise RiskRequestError("interval_hours must be between 1 and 12")
        now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        end = now + timedelta(hours=hours)
        results = await asyncio.gather(
            self.weather.get_conditions(latitude, longitude, "auto", refresh=refresh),
            self.marine.get_conditions(latitude, longitude, "auto", refresh=refresh),
            self.alerts.list_alerts(latitude=latitude, longitude=longitude, radius_km=self.config.alert_radius_km, start_time=now, end_time=end, refresh=refresh),
            return_exceptions=True,
        )
        weather = results[0] if isinstance(results[0], WeatherResponse) else None
        marine = results[1] if isinstance(results[1], MarineResponse) else None
        alerts = results[2] if isinstance(results[2], AlertListResponse) else None
        errors = self._errors(results)
        points: list[RiskTimelinePoint] = []
        all_limitations: list[str] = []
        for offset in range(0, hours + 1, interval_hours):
            target = now + timedelta(hours=offset)
            risk_input = self.builder.build(
                latitude=latitude, longitude=longitude, assessment_time=target,
                weather=weather, marine=marine, alert_response=alerts,
                prefer_current=False, collected_at=datetime.now(UTC), collection_errors=errors,
            )
            assessment = self.engine.evaluate(risk_input)
            points.append(RiskTimelinePoint(
                assessment_time=assessment.assessment_time, score=assessment.score,
                level=assessment.level, data_quality=assessment.data_quality,
                critical_factors=[factor.label for factor in assessment.critical_factors],
            ))
            all_limitations.extend(assessment.limitations)
        return RiskTimelineResponse(
            location=Location(latitude=latitude, longitude=longitude), generated_at=datetime.now(UTC),
            hours=hours, interval_hours=interval_hours, risk_model_version=self.config.version,
            points=points, limitations=list(dict.fromkeys(all_limitations)),
        )

    async def _collect(self, latitude: float, longitude: float, provider_target: datetime | None, refresh: bool, target: datetime, current: bool) -> tuple[WeatherResponse | None, MarineResponse | None, AlertListResponse | None, dict[str, str]]:
        alert_options = {
            "latitude": latitude, "longitude": longitude, "radius_km": self.config.alert_radius_km,
            "refresh": refresh, "active_only": current,
            **({} if current else {"start_time": target, "end_time": target}),
        }
        results = await asyncio.gather(
            self.weather.get_conditions(latitude, longitude, "auto", provider_target, refresh),
            self.marine.get_conditions(latitude, longitude, "auto", provider_target, refresh),
            self.alerts.list_alerts(**alert_options),
            return_exceptions=True,
        )
        return (
            results[0] if isinstance(results[0], WeatherResponse) else None,
            results[1] if isinstance(results[1], MarineResponse) else None,
            results[2] if isinstance(results[2], AlertListResponse) else None,
            self._errors(results),
        )

    @staticmethod
    def _errors(results: list[object] | tuple[object, ...]) -> dict[str, str]:
        errors: dict[str, str] = {}
        for name, result in zip(("weather", "marine", "alerts"), results, strict=True):
            if isinstance(result, BaseException):
                errors[name] = "unavailable"
        return errors

    def _target(self, requested: datetime | None, now: datetime) -> tuple[datetime, bool]:
        if requested is None:
            return now, True
        target = requested.astimezone(UTC)
        if target < now - timedelta(minutes=5):
            raise RiskRequestError("assessment_time must be current or future")
        if target > now + timedelta(hours=self.config.max_forecast_hours):
            raise RiskRequestError(f"assessment_time cannot exceed the {self.config.max_forecast_hours}-hour forecast horizon")
        return target, False
