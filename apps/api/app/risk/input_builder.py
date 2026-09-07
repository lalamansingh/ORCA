"""Collect normalized provider results into a provider-independent risk input."""

from datetime import UTC, datetime, timedelta
from math import asin, cos, radians, sin, sqrt
from typing import TypeVar

from app.domain.alerts import AlertFreshness, AlertSourceType, AlertStatus, ProviderAvailability
from app.risk.config import RiskEngineConfig
from app.risk.models import MarineRiskInput, RiskAlertInput, RiskProvenanceMode, RiskSourceMetadata
from app.schemas.alerts import AlertListResponse, MarineAlertRead
from app.schemas.evidence import DataFreshness, DataSource, EvidenceItem, Measurement
from app.schemas.marine import MarineConditions, MarineResponse
from app.schemas.weather import WeatherConditions, WeatherResponse

ForecastPoint = TypeVar("ForecastPoint", WeatherConditions, MarineConditions)


class RiskInputBuilder:
    def __init__(self, config: RiskEngineConfig) -> None:
        self.config = config

    def build(
        self, *, latitude: float, longitude: float, assessment_time: datetime,
        weather: WeatherResponse | None, marine: MarineResponse | None,
        alert_response: AlertListResponse | None, prefer_current: bool,
        collected_at: datetime, collection_errors: dict[str, str] | None = None,
    ) -> MarineRiskInput:
        target = assessment_time.astimezone(UTC)
        weather_point, weather_match = self._point(weather.current if weather else None, weather.hourly if weather else [], target, prefer_current)
        marine_point, marine_match = self._point(marine.current if marine else None, marine.hourly if marine else [], target, prefer_current)
        limitations: list[str] = []
        errors = collection_errors or {}
        if weather and not weather_match:
            limitations.append("No weather forecast point matched the requested assessment time within the configured tolerance.")
        if marine and not marine_match:
            limitations.append("No marine forecast point matched the requested assessment time within the configured tolerance.")
        limitations.extend(f"{name.title()} provider: {message}" for name, message in errors.items())
        if marine:
            limitations.extend(marine.limitations)
        if alert_response:
            limitations.extend(alert_response.limitations)

        relevant_alerts, ignored_spatial = self._relevant_alerts(alert_response, latitude, longitude, target)
        if ignored_spatial:
            limitations.append("Alerts without provider geometry or calculable proximity were not used in risk scoring.")

        sources = self._sources(weather, marine, alert_response, relevant_alerts)
        evidence = self._evidence(weather, weather_point, marine, marine_point, collected_at)
        freshness = {
            "weather": self._freshness(weather.retrieved_at if weather else None, weather_point.observed_at if weather_point else None, target, collected_at),
            "marine": self._freshness(marine.retrieved_at if marine else None, marine_point.observed_at if marine_point else None, target, collected_at),
            "alerts": self._alert_freshness(alert_response, collected_at),
        }
        availability = {
            "weather": weather_point is not None,
            "marine": marine_point is not None,
            "alerts": self._alerts_available(alert_response),
        }
        return MarineRiskInput(
            latitude=latitude,
            longitude=longitude,
            assessment_time=target,
            wave_height_m=self._value(marine_point.wave_height if marine_point else None),
            wave_period_s=self._value(marine_point.wave_period if marine_point else None),
            swell_height_m=self._value(marine_point.swell_height if marine_point else None),
            swell_period_s=self._value(marine_point.swell_period if marine_point else None),
            wind_speed_kmh=self._value(weather_point.wind_speed if weather_point else None),
            wind_gust_kmh=self._value(weather_point.wind_gust if weather_point else None),
            visibility_km=self._value(weather_point.visibility if weather_point else None),
            precipitation_mm=self._value(weather_point.precipitation if weather_point else None),
            weather_code=weather_point.weather_code if weather_point else None,
            ocean_current_speed_mps=self._value(marine_point.ocean_current_speed if marine_point else None),
            weather_observed_at=weather_point.observed_at if weather_point else None,
            marine_observed_at=marine_point.observed_at if marine_point else None,
            weather_retrieved_at=weather.retrieved_at if weather else None,
            marine_retrieved_at=marine.retrieved_at if marine else None,
            alerts=relevant_alerts,
            data_availability=availability,
            data_freshness=freshness,
            sources=sources,
            evidence=evidence,
            provenance_mode=self._provenance(sources, relevant_alerts),
            limitations=list(dict.fromkeys(limitations)),
        )

    def _point(self, current: ForecastPoint | None, hourly: list[ForecastPoint], target: datetime, prefer_current: bool) -> tuple[ForecastPoint | None, bool]:
        if prefer_current and current is not None:
            return current, True
        if not hourly:
            return None, False
        selected = min(hourly, key=lambda point: abs((point.observed_at.astimezone(UTC) - target).total_seconds()))
        difference = abs((selected.observed_at.astimezone(UTC) - target).total_seconds()) / 60
        return (selected, True) if difference <= self.config.forecast_match_tolerance_minutes else (None, False)

    def _freshness(self, retrieved_at: datetime | None, observed_at: datetime | None, target: datetime, now: datetime) -> DataFreshness:
        if retrieved_at is None or observed_at is None:
            return DataFreshness.UNAVAILABLE
        retrieval_age = max(0.0, (now - retrieved_at.astimezone(UTC)).total_seconds() / 3600)
        observation_age = max(0.0, (target - observed_at.astimezone(UTC)).total_seconds() / 3600) if target <= now + timedelta(minutes=5) else 0.0
        age = max(retrieval_age, observation_age)
        if age <= self.config.current_max_age_hours:
            return DataFreshness.CURRENT
        if age <= self.config.recent_max_age_hours:
            return DataFreshness.RECENT
        if age <= self.config.stale_max_age_hours:
            return DataFreshness.STALE
        return DataFreshness.UNAVAILABLE

    def _alert_freshness(self, response: AlertListResponse | None, now: datetime) -> DataFreshness:
        if not self._alerts_available(response):
            return DataFreshness.UNAVAILABLE
        if response is None:
            return DataFreshness.UNAVAILABLE
        age = max(0.0, (now - response.retrieved_at.astimezone(UTC)).total_seconds() / 3600)
        if age <= self.config.current_max_age_hours:
            return DataFreshness.CURRENT
        if age <= self.config.recent_max_age_hours:
            return DataFreshness.RECENT
        if age <= self.config.stale_max_age_hours:
            return DataFreshness.STALE
        return DataFreshness.UNAVAILABLE

    @staticmethod
    def _alerts_available(response: AlertListResponse | None) -> bool:
        if response is None or response.status == "unavailable":
            return False
        return any(source.status in {ProviderAvailability.OPERATIONAL, ProviderAvailability.DEGRADED, ProviderAvailability.DEMO} for source in response.sources) or response.status == "complete"

    def _relevant_alerts(self, response: AlertListResponse | None, latitude: float, longitude: float, target: datetime) -> tuple[list[RiskAlertInput], bool]:
        if response is None:
            return [], False
        relevant: list[RiskAlertInput] = []
        ignored_spatial = False
        for alert in response.alerts:
            if alert.status in {AlertStatus.EXPIRED, AlertStatus.CANCELLED, AlertStatus.UNKNOWN}:
                continue
            if alert.valid_from and target < alert.valid_from.astimezone(UTC):
                continue
            if alert.valid_until and target > alert.valid_until.astimezone(UTC):
                continue
            spatial = alert.is_inside is True or (alert.distance_km is not None and alert.distance_km <= self.config.alert_radius_km)
            if not spatial and alert.type.value != "CYCLONE" and alert.latitude is not None and alert.longitude is not None and alert.radius_km is not None:
                spatial = self._haversine_km(latitude, longitude, alert.latitude, alert.longitude) <= alert.radius_km + self.config.alert_radius_km
            if not spatial:
                ignored_spatial = True
                continue
            relevant.append(RiskAlertInput(
                id=alert.id, type=alert.type, severity=alert.severity, title=alert.title,
                source=alert.source, provider=alert.provider,
                source_url=str(alert.source_url) if alert.source_url else None,
                source_type=alert.source_type, valid_from=alert.valid_from, valid_until=alert.valid_until,
                issued_at=alert.issued_at, retrieved_at=alert.retrieved_at,
                distance_km=alert.distance_km, is_inside=alert.is_inside,
            ))
        return relevant, ignored_spatial

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6371.0088
        d_lat, d_lon = radians(lat2 - lat1), radians(lon2 - lon1)
        value = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        return 2 * radius * asin(sqrt(value))

    def _sources(self, weather: WeatherResponse | None, marine: MarineResponse | None, alerts: AlertListResponse | None, relevant: list[RiskAlertInput]) -> list[RiskSourceMetadata]:
        result: list[RiskSourceMetadata] = []
        for response in (weather, marine):
            if response:
                result.append(self._data_source(response.source, response.retrieved_at))
        if alerts:
            for source in alerts.sources:
                result.append(RiskSourceMetadata(provider=source.provider, dataset="Marine safety alerts", source_url=str(source.source_url) if source.source_url else None, status=source.status.value, retrieved_at=source.retrieved_at))
        for alert in relevant:
            result.append(RiskSourceMetadata(provider=alert.provider, dataset=alert.type.value.replace("_", " ").title(), source_url=alert.source_url, status=alert.severity.value, retrieved_at=alert.retrieved_at, source_type=alert.source_type))
        unique: dict[tuple[str, str, str | None], RiskSourceMetadata] = {}
        for source in result:
            unique[(source.provider, source.dataset, source.source_type.value if source.source_type else None)] = source
        return list(unique.values())

    @staticmethod
    def _data_source(source: DataSource, retrieved_at: datetime) -> RiskSourceMetadata:
        return RiskSourceMetadata(provider=source.provider, dataset=source.dataset, source_url=source.source_url, status="OPERATIONAL", retrieved_at=retrieved_at)

    def _evidence(self, weather: WeatherResponse | None, weather_point: WeatherConditions | None, marine: MarineResponse | None, marine_point: MarineConditions | None, collected_at: datetime) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        if weather and weather_point:
            values = [("wind_speed", weather_point.wind_speed), ("wind_gust", weather_point.wind_gust), ("visibility", weather_point.visibility), ("precipitation", weather_point.precipitation)]
            evidence.extend(self._measurement_evidence(values, weather.source, weather_point.observed_at, weather.retrieved_at, collected_at))
        if marine and marine_point:
            values = [("wave_height", marine_point.wave_height), ("wave_period", marine_point.wave_period), ("swell_height", marine_point.swell_height), ("swell_period", marine_point.swell_period), ("ocean_current_speed", marine_point.ocean_current_speed)]
            evidence.extend(self._measurement_evidence(values, marine.source, marine_point.observed_at, marine.retrieved_at, collected_at))
        return evidence

    def _measurement_evidence(self, values: list[tuple[str, Measurement | None]], source: DataSource, observed_at: datetime, retrieved_at: datetime, collected_at: datetime) -> list[EvidenceItem]:
        freshness = self._freshness(retrieved_at, observed_at, observed_at, collected_at)
        return [EvidenceItem(parameter=name, value=item.value, unit=item.unit, source=f"{source.provider} {source.dataset}", source_url=source.source_url, observed_at=observed_at, retrieved_at=retrieved_at, freshness=freshness) for name, item in values if item is not None]

    @staticmethod
    def _value(measurement: Measurement | None) -> float | None:
        return measurement.value if measurement is not None else None

    @staticmethod
    def _provenance(sources: list[RiskSourceMetadata], alerts: list[RiskAlertInput]) -> RiskProvenanceMode:
        demo = any(alert.source_type == AlertSourceType.DEMO for alert in alerts) or any("demo" in source.provider.lower() for source in sources)
        live = any(alert.source_type != AlertSourceType.DEMO for alert in alerts) or any("demo" not in source.provider.lower() and source.status in {"OPERATIONAL", "DEGRADED"} for source in sources)
        if demo and live:
            return RiskProvenanceMode.MIXED
        if demo:
            return RiskProvenanceMode.DEMO
        if live:
            return RiskProvenanceMode.LIVE
        return RiskProvenanceMode.UNAVAILABLE
