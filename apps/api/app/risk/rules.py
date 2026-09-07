"""Pure rules that convert normalized observations into auditable candidates."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.alerts import AlertSeverity, AlertType
from app.risk.config import RiskEngineConfig, ThresholdBand
from app.risk.models import RiskCategory, RiskFactorSeverity, RiskFactorType, RiskAlertInput


@dataclass(frozen=True)
class FactorCandidate:
    type: RiskFactorType
    category: RiskCategory
    label: str
    value: float | str | None
    unit: str | None
    severity: RiskFactorSeverity
    raw_score: int
    reason: str
    source: str
    source_url: str | None
    observed_at: datetime | None
    alert_id: UUID | None = None


def threshold_candidate(
    *, factor_type: RiskFactorType, category: RiskCategory, label: str, value: float | None,
    unit: str, band: ThresholdBand, source: str, observed_at: datetime | None,
    source_url: str | None = None, detail: str | None = None,
) -> FactorCandidate | None:
    if value is None:
        return None
    score, severity = band.classify(value)
    if detail:
        reason = detail
    elif score:
        reason = f"{label} crossed the configured {severity.lower()} prototype band."
    elif band.direction == "lower":
        reason = f"{label} remained above configured reduced-visibility bands."
    else:
        reason = f"{label} remained below configured elevated-risk bands."
    return FactorCandidate(factor_type, category, label, value, unit, RiskFactorSeverity(severity), score, reason, source, source_url, observed_at)


def alert_factor_type(alert_type: AlertType) -> RiskFactorType:
    return {
        AlertType.CYCLONE: RiskFactorType.CYCLONE,
        AlertType.STORM_SURGE: RiskFactorType.STORM_SURGE,
        AlertType.HIGH_WAVES: RiskFactorType.HIGH_WAVE_ALERT,
        AlertType.SWELL_SURGE: RiskFactorType.HIGH_WAVE_ALERT,
        AlertType.STRONG_WIND: RiskFactorType.WIND,
        AlertType.LIGHTNING: RiskFactorType.LIGHTNING,
        AlertType.HEAVY_RAIN: RiskFactorType.PRECIPITATION,
        AlertType.LOW_VISIBILITY: RiskFactorType.VISIBILITY,
    }.get(alert_type, RiskFactorType.OTHER)


def alert_severity(value: AlertSeverity) -> RiskFactorSeverity:
    return {
        AlertSeverity.INFO: RiskFactorSeverity.LOW,
        AlertSeverity.WATCH: RiskFactorSeverity.MODERATE,
        AlertSeverity.WARNING: RiskFactorSeverity.HIGH,
        AlertSeverity.SEVERE: RiskFactorSeverity.HIGH,
        AlertSeverity.CRITICAL: RiskFactorSeverity.EXTREME,
    }[value]


def alert_candidate(alert: RiskAlertInput, config: RiskEngineConfig) -> FactorCandidate:
    rule = config.alert_rules[alert.severity]
    return FactorCandidate(
        type=alert_factor_type(alert.type), category=RiskCategory.OFFICIAL_ALERTS,
        label=alert.title, value=alert.severity.value, unit=None,
        severity=alert_severity(alert.severity), raw_score=rule.score,
        reason=f"A spatially and temporally relevant {alert.severity.value.lower()} {alert.source_type.value.lower().replace('_', ' ')} applies to the selected location.",
        source=f"{alert.provider} · {alert.source}", source_url=alert.source_url,
        observed_at=alert.issued_at or alert.retrieved_at, alert_id=alert.id,
    )
