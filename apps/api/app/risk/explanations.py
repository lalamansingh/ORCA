"""Template-only summaries and recommendations; no generated language or LLMs."""

from app.risk.models import RiskFactor, RiskLevel


RECOMMENDATIONS = {
    RiskLevel.LOW: "Current forecast conditions indicate relatively low general marine operational risk. Continue monitoring official advisories before departure.",
    RiskLevel.MODERATE: "Some conditions may require additional caution. Review the contributing factors and latest official advisories before departure.",
    RiskLevel.HIGH: "Elevated marine hazards are present. Consider postponing marine activity and follow official advisories.",
    RiskLevel.EXTREME: "Severe marine hazards are indicated. Avoid marine activity in the affected area and follow official authority instructions.",
    RiskLevel.UNAVAILABLE: "There is not enough current information to calculate marine operational risk responsibly. Check official advisories and retry when required forecast data is available.",
}


def recommendation(level: RiskLevel) -> str:
    return RECOMMENDATIONS[level]


def summary(level: RiskLevel, factors: list[RiskFactor]) -> str:
    if level == RiskLevel.UNAVAILABLE:
        return "Risk is unavailable because required wave or wind information is missing, stale, or unmatched to the requested time."
    important = [factor.label.lower() for factor in factors if factor.score_contribution > 0][:2]
    if not important:
        return "Risk is LOW because no configured hazard threshold was crossed in the available inputs."
    if len(important) == 1:
        return f"Risk is {level.value} primarily because of {important[0]}."
    return f"Risk is {level.value} primarily because of {important[0]} and {important[1]}."
