"""Deterministic ORCA marine operational risk calculation."""

from collections import defaultdict
from datetime import UTC, datetime

from app.risk.config import DEFAULT_RISK_CONFIG, RiskEngineConfig
from app.risk.explanations import recommendation, summary
from app.risk.models import (
    MarineRiskAssessment, MarineRiskInput, RiskCategory, RiskDataQuality, RiskFactor,
    RiskAlertInput, RiskFactorSeverity, RiskFactorType, RiskLevel,
)
from app.risk.rules import FactorCandidate, alert_candidate, threshold_candidate
from app.risk.scoring import diminishing_union, marginal_group_contributions, overlap_capped_score, proportional_integer_allocation
from app.schemas.evidence import DataFreshness, Location


CATEGORY_ORDER = [RiskCategory.SEA_STATE, RiskCategory.WIND, RiskCategory.VISIBILITY_WEATHER, RiskCategory.OCEAN_CURRENT, RiskCategory.OFFICIAL_ALERTS]
SEVERITY_ORDER = {RiskFactorSeverity.LOW: 0, RiskFactorSeverity.MODERATE: 1, RiskFactorSeverity.HIGH: 2, RiskFactorSeverity.EXTREME: 3}
PROTOTYPE_LIMITATION = "Prototype thresholds — require validation for vessel type and local authority guidance."
VESSEL_LIMITATION = "This is general marine operational risk, not a guarantee that conditions are safe for a particular vessel, crew, route, or activity."


class MarineRiskEngine:
    def __init__(self, config: RiskEngineConfig = DEFAULT_RISK_CONFIG) -> None:
        self.config = config
        self.self_check()

    def self_check(self) -> None:
        self.config.self_check()
        if diminishing_union([0, 100]) != 100 or diminishing_union([]) != 0:
            raise ValueError("risk scoring self-check failed")

    def evaluate(self, data: MarineRiskInput, *, calculated_at: datetime | None = None) -> MarineRiskAssessment:
        candidates = self._candidates(data)
        factors, score = self._score(candidates)
        floor, floor_factor = self._alert_floor(data)
        if floor > score:
            difference = floor - score
            if floor_factor:
                for factor in factors:
                    if factor.alert_id == floor_factor.id:
                        factor.score_contribution += difference
                        factor.reason += f" The configured alert override sets a minimum score of {floor}."
                        break
            score = floor
        score = min(100, max(0, score))

        missing = self._missing_inputs(data)
        quality = self._data_quality(data, missing, floor)
        unavailable = quality == RiskDataQuality.INSUFFICIENT
        level = RiskLevel.UNAVAILABLE if unavailable else self._level(score)
        ordered = sorted(factors, key=lambda factor: (-factor.score_contribution, -SEVERITY_ORDER[factor.severity], factor.type.value, factor.label))
        critical = [factor for factor in ordered if factor.score_contribution > 0][:3]
        limitations = list(dict.fromkeys([PROTOTYPE_LIMITATION, VESSEL_LIMITATION, *data.limitations]))
        if missing:
            limitations.append(f"Missing inputs: {', '.join(missing)}.")
        if quality in {RiskDataQuality.LIMITED, RiskDataQuality.POOR, RiskDataQuality.INSUFFICIENT}:
            limitations.append("Incomplete or stale inputs reduce confidence; missing data does not lower the calculated hazard score.")
        if data.provenance_mode.value in {"DEMO", "MIXED"}:
            limitations.append("Demo data influenced this assessment; it must not be presented as fully live or official.")
        return MarineRiskAssessment(
            score=None if unavailable else score,
            level=level,
            assessment_time=data.assessment_time,
            location=Location(latitude=data.latitude, longitude=data.longitude),
            recommendation=recommendation(level),
            summary=summary(level, critical),
            factors=ordered,
            critical_factors=critical,
            data_quality=quality,
            missing_inputs=missing,
            evidence=data.evidence,
            sources=data.sources,
            provenance_mode=data.provenance_mode,
            risk_model_version=self.config.version,
            calculated_at=calculated_at or datetime.now(UTC),
            limitations=list(dict.fromkeys(limitations)),
        )

    def _candidates(self, data: MarineRiskInput) -> list[FactorCandidate]:
        marine_source = self._source(data, "marine")
        weather_source = self._source(data, "weather")
        candidates = [
            threshold_candidate(factor_type=RiskFactorType.WAVE_HEIGHT, category=RiskCategory.SEA_STATE, label="Wave height", value=data.wave_height_m, unit="m", band=self.config.wave_height, source=marine_source[0], source_url=marine_source[1], observed_at=data.marine_observed_at),
            threshold_candidate(factor_type=RiskFactorType.SWELL, category=RiskCategory.SEA_STATE, label="Swell", value=data.swell_height_m, unit="m", band=self.config.swell_height, source=marine_source[0], source_url=marine_source[1], observed_at=data.marine_observed_at, detail=self._swell_reason(data)),
            threshold_candidate(factor_type=RiskFactorType.WIND, category=RiskCategory.WIND, label="Sustained wind", value=data.wind_speed_kmh, unit="km/h", band=self.config.wind_speed, source=weather_source[0], source_url=weather_source[1], observed_at=data.weather_observed_at),
            threshold_candidate(factor_type=RiskFactorType.WIND_GUST, category=RiskCategory.WIND, label="Wind gust", value=data.wind_gust_kmh, unit="km/h", band=self.config.wind_gust, source=weather_source[0], source_url=weather_source[1], observed_at=data.weather_observed_at),
            threshold_candidate(factor_type=RiskFactorType.VISIBILITY, category=RiskCategory.VISIBILITY_WEATHER, label="Visibility", value=data.visibility_km, unit="km", band=self.config.visibility, source=weather_source[0], source_url=weather_source[1], observed_at=data.weather_observed_at),
            threshold_candidate(factor_type=RiskFactorType.PRECIPITATION, category=RiskCategory.VISIBILITY_WEATHER, label="Precipitation", value=data.precipitation_mm, unit="mm", band=self.config.precipitation, source=weather_source[0], source_url=weather_source[1], observed_at=data.weather_observed_at),
            threshold_candidate(factor_type=RiskFactorType.OCEAN_CURRENT, category=RiskCategory.OCEAN_CURRENT, label="Ocean current", value=data.ocean_current_speed_mps, unit="m/s", band=self.config.ocean_current, source=marine_source[0], source_url=marine_source[1], observed_at=data.marine_observed_at),
        ]
        result = [candidate for candidate in candidates if candidate is not None]
        swell = next((item for item in result if item.type == RiskFactorType.SWELL), None)
        if swell and swell.raw_score > 0 and data.swell_period_s is not None and data.swell_period_s >= self.config.swell_long_period_s:
            result[result.index(swell)] = FactorCandidate(**{**swell.__dict__, "raw_score": swell.raw_score + self.config.swell_long_period_bonus, "reason": f"{swell.reason} Long-period swell ({data.swell_period_s:g} s) adds the configured prototype bonus."})
        if data.weather_code in {95, 96, 99}:
            result.append(FactorCandidate(RiskFactorType.LIGHTNING, RiskCategory.VISIBILITY_WEATHER, "Forecast thunderstorm risk", str(data.weather_code), "WMO code", RiskFactorSeverity.HIGH, self.config.thunderstorm_forecast_score, "The forecast weather code indicates thunderstorm risk; it is not a confirmed lightning observation.", weather_source[0], weather_source[1], data.weather_observed_at))
        result.extend(alert_candidate(alert, self.config) for alert in data.alerts)
        return result

    def _score(self, candidates: list[FactorCandidate]) -> tuple[list[RiskFactor], int]:
        grouped: dict[RiskCategory, list[FactorCandidate]] = defaultdict(list)
        for candidate in candidates:
            grouped[candidate.category].append(candidate)
        group_scores: list[int] = []
        group_allocations: list[list[int]] = []
        ordered_groups: list[list[FactorCandidate]] = []
        for category in CATEGORY_ORDER:
            items = grouped.get(category, [])
            group_score, allocations = overlap_capped_score([item.raw_score for item in items], self.config.category_caps[category], self.config.overlap_discount)
            ordered_groups.append(items)
            group_scores.append(group_score)
            group_allocations.append(allocations)
        marginals = marginal_group_contributions(group_scores)
        factors: list[RiskFactor] = []
        for items, allocations, marginal in zip(ordered_groups, group_allocations, marginals, strict=True):
            applied = proportional_integer_allocation(marginal, allocations)
            for candidate, contribution in zip(items, applied, strict=True):
                factors.append(RiskFactor(
                    type=candidate.type, category=candidate.category, label=candidate.label,
                    observed_value=candidate.value, unit=candidate.unit, severity=candidate.severity,
                    score_contribution=contribution, reason=candidate.reason, source=candidate.source,
                    source_url=candidate.source_url, observed_at=candidate.observed_at, alert_id=candidate.alert_id,
                ))
        return factors, sum(marginals)

    def _alert_floor(self, data: MarineRiskInput) -> tuple[int, RiskAlertInput | None]:
        floor = 0
        selected = None
        for alert in data.alerts:
            candidate = self.config.alert_rules[alert.severity].minimum_score
            candidate = max(candidate, self.config.hazard_overrides.get(alert.type, {}).get(alert.severity, 0))
            if candidate > floor:
                floor, selected = candidate, alert
        return floor, selected

    def _missing_inputs(self, data: MarineRiskInput) -> list[str]:
        values = {
            "wave_height_m": data.wave_height_m,
            "wind_speed_kmh": data.wind_speed_kmh,
            "wind_gust_kmh": data.wind_gust_kmh,
            "visibility_km": data.visibility_km,
            "precipitation_mm": data.precipitation_mm,
            "swell_height_m": data.swell_height_m,
            "ocean_current_speed_mps": data.ocean_current_speed_mps,
        }
        return [name for name, value in values.items() if value is None]

    def _data_quality(self, data: MarineRiskInput, missing: list[str], alert_floor: int) -> RiskDataQuality:
        required_missing = {"wave_height_m", "wind_speed_kmh"}.intersection(missing)
        required_stale = any(data.data_freshness.get(name) in {DataFreshness.STALE, DataFreshness.UNAVAILABLE} for name in ("weather", "marine"))
        if required_missing or required_stale:
            return RiskDataQuality.POOR if alert_floor >= self.config.levels.high else RiskDataQuality.INSUFFICIENT
        if any(value == DataFreshness.STALE for value in data.data_freshness.values()):
            return RiskDataQuality.LIMITED
        present = 7 - len(missing)
        alerts_available = data.data_availability.get("alerts", False)
        if present == 7 and alerts_available and all(value == DataFreshness.CURRENT for value in data.data_freshness.values()):
            return RiskDataQuality.EXCELLENT
        if present >= 5 and alerts_available:
            return RiskDataQuality.GOOD
        return RiskDataQuality.LIMITED

    def _level(self, score: int) -> RiskLevel:
        if score >= self.config.levels.extreme:
            return RiskLevel.EXTREME
        if score >= self.config.levels.high:
            return RiskLevel.HIGH
        if score >= self.config.levels.moderate:
            return RiskLevel.MODERATE
        return RiskLevel.LOW

    @staticmethod
    def _source(data: MarineRiskInput, dataset_hint: str) -> tuple[str, str | None]:
        source = next((item for item in data.sources if dataset_hint in item.dataset.lower()), None)
        return (source.provider, source.source_url) if source else ("Provider unavailable", None)

    def _swell_reason(self, data: MarineRiskInput) -> str:
        if data.swell_height_m is None:
            return "Swell is unavailable."
        score, severity = self.config.swell_height.classify(data.swell_height_m)
        if not score:
            return "Swell remained below configured elevated-risk bands."
        period = f" with a {data.swell_period_s:g} s period" if data.swell_period_s is not None else ""
        return f"Swell height{period} crossed the configured {severity.lower()} prototype band."
