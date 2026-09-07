from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertType
from app.risk.config import DEFAULT_RISK_CONFIG, ThresholdBand
from app.risk.engine import MarineRiskEngine
from app.risk.models import (
    MarineRiskInput, RiskAlertInput, RiskCategory, RiskDataQuality, RiskLevel,
    RiskProvenanceMode, RiskSourceMetadata,
)
from app.risk.scoring import diminishing_union, overlap_capped_score
from app.schemas.evidence import DataFreshness

NOW = datetime(2026, 9, 7, 6, tzinfo=UTC)
ENGINE = MarineRiskEngine()


def risk_input(**updates) -> MarineRiskInput:  # type: ignore[no-untyped-def]
    values = {
        "latitude": 13.08,
        "longitude": 80.27,
        "assessment_time": NOW,
        "wave_height_m": 0.5,
        "wave_period_s": 6.0,
        "swell_height_m": 0.4,
        "swell_period_s": 7.0,
        "wind_speed_kmh": 12.0,
        "wind_gust_kmh": 18.0,
        "visibility_km": 20.0,
        "precipitation_mm": 0.0,
        "weather_code": 1,
        "ocean_current_speed_mps": 0.2,
        "weather_observed_at": NOW,
        "marine_observed_at": NOW,
        "weather_retrieved_at": NOW,
        "marine_retrieved_at": NOW,
        "data_availability": {"weather": True, "marine": True, "alerts": True},
        "data_freshness": {"weather": DataFreshness.CURRENT, "marine": DataFreshness.CURRENT, "alerts": DataFreshness.CURRENT},
        "sources": [
            RiskSourceMetadata(provider="Weather Test", dataset="Weather", status="OPERATIONAL", retrieved_at=NOW),
            RiskSourceMetadata(provider="Marine Test", dataset="Marine", status="OPERATIONAL", retrieved_at=NOW),
        ],
        "provenance_mode": RiskProvenanceMode.LIVE,
    }
    values.update(updates)
    return MarineRiskInput(**values)


def alert(alert_type: AlertType, severity: AlertSeverity, *, source_type: AlertSourceType = AlertSourceType.OFFICIAL_ADVISORY) -> RiskAlertInput:
    return RiskAlertInput(
        id=uuid4(), type=alert_type, severity=severity, title=f"{severity.value} {alert_type.value}",
        source="Test authority", provider="Official Test Provider", source_type=source_type,
        valid_from=NOW - timedelta(hours=1), valid_until=NOW + timedelta(hours=6),
        issued_at=NOW - timedelta(hours=1), retrieved_at=NOW, distance_km=2, is_inside=True,
    )


@pytest.mark.parametrize(
    ("changes", "expected_score", "expected_level"),
    [
        ({}, 0, RiskLevel.LOW),
        ({"wave_height_m": 1.5}, 25, RiskLevel.MODERATE),
        ({"wave_height_m": 3.0}, 50, RiskLevel.HIGH),
        ({"wave_height_m": 5.0}, 75, RiskLevel.EXTREME),
        ({"wind_speed_kmh": 55.0}, 50, RiskLevel.HIGH),
        ({"wind_gust_kmh": 70.0}, 35, RiskLevel.MODERATE),
        ({"visibility_km": 3.0}, 35, RiskLevel.MODERATE),
        ({"visibility_km": 0.5}, 55, RiskLevel.HIGH),
        ({"precipitation_mm": 20.0}, 20, RiskLevel.LOW),
        ({"ocean_current_speed_mps": 1.6}, 35, RiskLevel.MODERATE),
        ({"swell_height_m": 3.0, "swell_period_s": 13.0}, 38, RiskLevel.MODERATE),
    ],
)
def test_environmental_rules_are_deterministic(changes, expected_score: int, expected_level: RiskLevel) -> None:  # type: ignore[no-untyped-def]
    first = ENGINE.evaluate(risk_input(**changes), calculated_at=NOW)
    second = ENGINE.evaluate(risk_input(**changes), calculated_at=NOW)
    assert first.model_dump() == second.model_dump()
    assert first.score == expected_score
    assert first.level == expected_level


def test_good_visibility_explanation_respects_lower_is_risk_direction() -> None:
    assessment = ENGINE.evaluate(risk_input(visibility_km=20), calculated_at=NOW)
    visibility = next(factor for factor in assessment.factors if factor.type.value == "VISIBILITY")
    assert visibility.score_contribution == 0
    assert "above configured reduced-visibility bands" in visibility.reason


def test_gust_and_sustained_wind_are_overlap_discounted() -> None:
    assessment = ENGINE.evaluate(risk_input(wind_speed_kmh=70, wind_gust_kmh=90), calculated_at=NOW)
    wind = [factor for factor in assessment.factors if factor.category == RiskCategory.WIND]
    assert sum(factor.score_contribution for factor in wind) == DEFAULT_RISK_CONFIG.category_caps[RiskCategory.WIND]
    assert sum(factor.score_contribution for factor in wind) < 75 + 60


def test_wave_and_swell_category_cap_prevents_double_counting() -> None:
    assessment = ENGINE.evaluate(risk_input(wave_height_m=5, swell_height_m=5, swell_period_s=14), calculated_at=NOW)
    sea_state = [factor for factor in assessment.factors if factor.category == RiskCategory.SEA_STATE]
    assert sum(factor.score_contribution for factor in sea_state) == 75
    assert assessment.score == 75


@pytest.mark.parametrize(
    ("risk_alert", "score", "level"),
    [
        (alert(AlertType.HIGH_WAVES, AlertSeverity.WARNING), 50, RiskLevel.HIGH),
        (alert(AlertType.CYCLONE, AlertSeverity.SEVERE), 75, RiskLevel.EXTREME),
        (alert(AlertType.STORM_SURGE, AlertSeverity.SEVERE), 70, RiskLevel.HIGH),
        (alert(AlertType.OTHER, AlertSeverity.CRITICAL), 90, RiskLevel.EXTREME),
    ],
)
def test_official_alert_escalation_and_critical_overrides(risk_alert: RiskAlertInput, score: int, level: RiskLevel) -> None:
    assessment = ENGINE.evaluate(risk_input(alerts=[risk_alert]), calculated_at=NOW)
    assert assessment.score == score
    assert assessment.level == level
    assert assessment.critical_factors[0].alert_id == risk_alert.id


def test_forecast_thunderstorm_is_not_labeled_as_observed_lightning() -> None:
    assessment = ENGINE.evaluate(risk_input(weather_code=95), calculated_at=NOW)
    factor = next(item for item in assessment.factors if item.type.value == "LIGHTNING")
    assert factor.score_contribution == 18
    assert "not a confirmed lightning observation" in factor.reason


@pytest.mark.parametrize("missing", ["wave_height_m", "wind_speed_kmh"])
def test_missing_required_inputs_return_unavailable(missing: str) -> None:
    assessment = ENGINE.evaluate(risk_input(**{missing: None}), calculated_at=NOW)
    assert assessment.score is None
    assert assessment.level == RiskLevel.UNAVAILABLE
    assert assessment.data_quality == RiskDataQuality.INSUFFICIENT
    assert missing in assessment.missing_inputs


def test_partial_provider_failure_does_not_become_low() -> None:
    assessment = ENGINE.evaluate(risk_input(wave_height_m=None, data_availability={"weather": True, "marine": False, "alerts": True}, data_freshness={"weather": DataFreshness.CURRENT, "marine": DataFreshness.UNAVAILABLE, "alerts": DataFreshness.CURRENT}), calculated_at=NOW)
    assert assessment.level == RiskLevel.UNAVAILABLE
    assert assessment.score is None


def test_stale_required_data_is_insufficient_and_does_not_lower_risk() -> None:
    assessment = ENGINE.evaluate(risk_input(data_freshness={"weather": DataFreshness.STALE, "marine": DataFreshness.CURRENT, "alerts": DataFreshness.CURRENT}), calculated_at=NOW)
    assert assessment.level == RiskLevel.UNAVAILABLE
    assert assessment.data_quality == RiskDataQuality.INSUFFICIENT


def test_severe_alert_can_escalate_with_missing_forecast_but_quality_is_poor() -> None:
    assessment = ENGINE.evaluate(risk_input(wave_height_m=None, alerts=[alert(AlertType.CYCLONE, AlertSeverity.SEVERE)]), calculated_at=NOW)
    assert assessment.score == 75
    assert assessment.level == RiskLevel.EXTREME
    assert assessment.data_quality == RiskDataQuality.POOR


def test_score_boundaries_model_version_and_factor_ordering() -> None:
    assessment = ENGINE.evaluate(risk_input(wave_height_m=3, wind_speed_kmh=55, visibility_km=3, ocean_current_speed_mps=1.6), calculated_at=NOW)
    contributions = [factor.score_contribution for factor in assessment.factors]
    assert assessment.risk_model_version == "orca-risk-v1"
    assert contributions == sorted(contributions, reverse=True)
    assert assessment.score == sum(contributions)
    assert 0 <= assessment.score <= 100
    assert diminishing_union([]) == 0
    assert diminishing_union([100, 100]) == 100


def test_category_caps_and_threshold_order_self_check() -> None:
    assert overlap_capped_score([75, 60], 75, 0.25)[0] == 75
    with pytest.raises(ValidationError):
        ThresholdBand(moderate=3, high=2, extreme=1, moderate_score=1, high_score=2, extreme_score=3)


def test_golden_scenarios() -> None:
    scenarios = {
        "A_CALM": (risk_input(), 0, RiskLevel.LOW, RiskDataQuality.EXCELLENT),
        "B_MODERATE_SEA": (risk_input(wave_height_m=1.5), 25, RiskLevel.MODERATE, RiskDataQuality.EXCELLENT),
        "C_HIGH_WAVE_WIND": (risk_input(wave_height_m=3, wind_speed_kmh=55), 75, RiskLevel.EXTREME, RiskDataQuality.EXCELLENT),
        "D_CYCLONE_WARNING": (risk_input(alerts=[alert(AlertType.CYCLONE, AlertSeverity.SEVERE)]), 75, RiskLevel.EXTREME, RiskDataQuality.EXCELLENT),
        "E_PROVIDER_UNAVAILABLE": (risk_input(wave_height_m=None), None, RiskLevel.UNAVAILABLE, RiskDataQuality.INSUFFICIENT),
        "F_ADVISORY_MILD_MODEL": (risk_input(alerts=[alert(AlertType.HIGH_WAVES, AlertSeverity.WARNING)]), 50, RiskLevel.HIGH, RiskDataQuality.EXCELLENT),
    }
    for item, expected_score, expected_level, expected_quality in scenarios.values():
        assessment = ENGINE.evaluate(item, calculated_at=NOW)
        assert (assessment.score, assessment.level, assessment.data_quality) == (expected_score, expected_level, expected_quality)
