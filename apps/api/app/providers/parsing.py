from datetime import UTC, datetime
from typing import Any

from app.schemas.evidence import Measurement


def as_float(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def measurement(value: Any, unit: str, scale: float = 1.0) -> Measurement | None:
    numeric = as_float(value)
    return Measurement(value=numeric * scale, unit=unit) if numeric is not None else None


def timestamp(value: Any) -> datetime:
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, UTC)
    if isinstance(value, str):
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return datetime.now(UTC)


def column_value(block: dict[str, Any], key: str, index: int) -> Any:
    values = block.get(key)
    return values[index] if isinstance(values, list) and index < len(values) else None
