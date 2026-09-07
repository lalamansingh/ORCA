from datetime import datetime
from typing import Protocol, TypeVar


class ForecastPoint(Protocol):
    observed_at: datetime


T = TypeVar("T", bound=ForecastPoint)


def find_forecast_at_time(points: list[T], requested_at: datetime) -> T | None:
    """Return the nearest forecast instant using timezone-aware absolute time."""
    if not points:
        return None
    if requested_at.tzinfo is None:
        raise ValueError("requested_at must include timezone information")
    return min(points, key=lambda point: abs((point.observed_at - requested_at).total_seconds()))
