from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass
class ProviderStatus:
    provider: str
    status: str = "not_checked"
    last_success: datetime | None = None
    last_failure: datetime | None = None
    error_code: str | None = None


class ProviderStatusRegistry:
    def __init__(self) -> None:
        self._statuses: dict[str, ProviderStatus] = {
            "weather": ProviderStatus(provider="Open-Meteo Weather"),
            "marine": ProviderStatus(provider="Open-Meteo Marine"),
        }

    def success(self, kind: str) -> None:
        item = self._statuses[kind]
        item.status, item.last_success, item.error_code = "operational", datetime.now(UTC), None

    def failure(self, kind: str, code: str) -> None:
        item = self._statuses[kind]
        item.status, item.last_failure, item.error_code = "unavailable", datetime.now(UTC), code

    def snapshot(self) -> dict[str, ProviderStatus]:
        return self._statuses.copy()
