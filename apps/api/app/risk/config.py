"""Auditable configuration for ORCA's prototype marine risk model."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.domain.alerts import AlertSeverity, AlertType
from app.risk.models import RiskCategory


class ThresholdBand(BaseModel):
    direction: Literal["higher", "lower"] = "higher"
    moderate: float
    high: float
    extreme: float
    moderate_score: int = Field(ge=0, le=100)
    high_score: int = Field(ge=0, le=100)
    extreme_score: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def validate_order(self) -> "ThresholdBand":
        ordered = self.moderate < self.high < self.extreme if self.direction == "higher" else self.moderate > self.high > self.extreme
        if not ordered:
            raise ValueError(f"{self.direction} risk thresholds are not strictly ordered")
        if not self.moderate_score <= self.high_score <= self.extreme_score:
            raise ValueError("risk scores must be ordered")
        return self

    def classify(self, value: float) -> tuple[int, str]:
        if self.direction == "higher":
            if value >= self.extreme:
                return self.extreme_score, "EXTREME"
            if value >= self.high:
                return self.high_score, "HIGH"
            if value >= self.moderate:
                return self.moderate_score, "MODERATE"
        else:
            if value <= self.extreme:
                return self.extreme_score, "EXTREME"
            if value <= self.high:
                return self.high_score, "HIGH"
            if value <= self.moderate:
                return self.moderate_score, "MODERATE"
        return 0, "LOW"


class RiskLevelBoundaries(BaseModel):
    moderate: int = Field(ge=1, le=99)
    high: int = Field(ge=1, le=99)
    extreme: int = Field(ge=1, le=100)

    @model_validator(mode="after")
    def validate_order(self) -> "RiskLevelBoundaries":
        if not self.moderate < self.high < self.extreme:
            raise ValueError("risk-level boundaries must be strictly ordered")
        return self


class AlertScoreRule(BaseModel):
    score: int = Field(ge=0, le=100)
    minimum_score: int = Field(ge=0, le=100)


class RiskEngineConfig(BaseModel):
    version: str = Field(min_length=1)
    levels: RiskLevelBoundaries
    wave_height: ThresholdBand
    swell_height: ThresholdBand
    wind_speed: ThresholdBand
    wind_gust: ThresholdBand
    visibility: ThresholdBand
    precipitation: ThresholdBand
    ocean_current: ThresholdBand
    category_caps: dict[RiskCategory, int]
    overlap_discount: float = Field(ge=0, le=1)
    swell_long_period_s: float = Field(gt=0)
    swell_long_period_bonus: int = Field(ge=0, le=10)
    thunderstorm_forecast_score: int = Field(ge=0, le=20)
    alert_rules: dict[AlertSeverity, AlertScoreRule]
    hazard_overrides: dict[AlertType, dict[AlertSeverity, int]]
    current_max_age_hours: float = Field(gt=0)
    recent_max_age_hours: float = Field(gt=0)
    stale_max_age_hours: float = Field(gt=0)
    forecast_match_tolerance_minutes: int = Field(gt=0)
    max_forecast_hours: int = Field(gt=0, le=168)
    alert_radius_km: float = Field(gt=0, le=2000)

    @model_validator(mode="after")
    def self_check(self) -> "RiskEngineConfig":
        expected = set(RiskCategory)
        if set(self.category_caps) != expected:
            raise ValueError("every risk category must have exactly one cap")
        if any(not 0 <= cap <= 100 for cap in self.category_caps.values()):
            raise ValueError("category caps must remain inside 0..100")
        if set(self.alert_rules) != set(AlertSeverity):
            raise ValueError("every alert severity must have a score rule")
        if not self.current_max_age_hours < self.recent_max_age_hours < self.stale_max_age_hours:
            raise ValueError("freshness boundaries must be strictly ordered")
        for rules in self.hazard_overrides.values():
            if any(not 0 <= score <= 100 for score in rules.values()):
                raise ValueError("hazard override floors must remain inside 0..100")
        return self


DEFAULT_RISK_CONFIG = RiskEngineConfig(
    version="orca-risk-v1",
    levels=RiskLevelBoundaries(moderate=25, high=50, extreme=75),
    wave_height=ThresholdBand(moderate=1.25, high=2.5, extreme=4.0, moderate_score=25, high_score=50, extreme_score=75),
    swell_height=ThresholdBand(moderate=1.25, high=2.5, extreme=4.0, moderate_score=15, high_score=35, extreme_score=60),
    wind_speed=ThresholdBand(moderate=31.0, high=52.0, extreme=63.0, moderate_score=25, high_score=50, extreme_score=75),
    wind_gust=ThresholdBand(moderate=40.0, high=63.0, extreme=85.0, moderate_score=15, high_score=35, extreme_score=60),
    visibility=ThresholdBand(direction="lower", moderate=10.0, high=4.0, extreme=1.0, moderate_score=15, high_score=35, extreme_score=55),
    precipitation=ThresholdBand(moderate=2.5, high=7.5, extreme=15.0, moderate_score=5, high_score=12, extreme_score=20),
    ocean_current=ThresholdBand(moderate=0.5, high=1.0, extreme=1.5, moderate_score=10, high_score=20, extreme_score=35),
    category_caps={
        RiskCategory.SEA_STATE: 75,
        RiskCategory.WIND: 75,
        RiskCategory.VISIBILITY_WEATHER: 55,
        RiskCategory.OCEAN_CURRENT: 35,
        RiskCategory.OFFICIAL_ALERTS: 95,
    },
    overlap_discount=0.25,
    swell_long_period_s=12.0,
    swell_long_period_bonus=3,
    thunderstorm_forecast_score=18,
    alert_rules={
        AlertSeverity.INFO: AlertScoreRule(score=5, minimum_score=0),
        AlertSeverity.WATCH: AlertScoreRule(score=25, minimum_score=25),
        AlertSeverity.WARNING: AlertScoreRule(score=50, minimum_score=40),
        AlertSeverity.SEVERE: AlertScoreRule(score=70, minimum_score=50),
        AlertSeverity.CRITICAL: AlertScoreRule(score=90, minimum_score=75),
    },
    hazard_overrides={
        AlertType.HIGH_WAVES: {AlertSeverity.WARNING: 50, AlertSeverity.SEVERE: 65, AlertSeverity.CRITICAL: 80},
        AlertType.CYCLONE: {AlertSeverity.WARNING: 50, AlertSeverity.SEVERE: 75, AlertSeverity.CRITICAL: 90},
        AlertType.STORM_SURGE: {AlertSeverity.WARNING: 50, AlertSeverity.SEVERE: 70, AlertSeverity.CRITICAL: 90},
        AlertType.TSUNAMI: {AlertSeverity.WARNING: 75, AlertSeverity.SEVERE: 85, AlertSeverity.CRITICAL: 95},
    },
    current_max_age_hours=3,
    recent_max_age_hours=6,
    stale_max_age_hours=12,
    forecast_match_tolerance_minutes=90,
    max_forecast_hours=48,
    alert_radius_km=250,
)
