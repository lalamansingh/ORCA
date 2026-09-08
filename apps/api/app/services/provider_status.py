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
            "alerts_imd": ProviderStatus(provider="IMD Alerts (CAP)", status="not_checked"),
            "alerts_incois": ProviderStatus(provider="INCOIS Alerts", status="operational", last_success=datetime.now(UTC)),
            "alerts_demo": ProviderStatus(provider="ORCA Demo Alerts", status="not_configured"),
            "pfz": ProviderStatus(provider="INCOIS PFZ WebGIS", status="not_checked"),
            "risk_engine": ProviderStatus(provider="ORCA Risk Engine", status="operational", last_success=datetime.now(UTC)),
            "llm": ProviderStatus(provider="Configured LLM", status="disabled"),

        }

    def success(self, kind: str) -> None:
        item = self._statuses[kind]
        item.status, item.last_success, item.error_code = "operational", datetime.now(UTC), None

    def failure(self, kind: str, code: str) -> None:
        item = self._statuses[kind]
        item.status, item.last_failure, item.error_code = "unavailable", datetime.now(UTC), code

    def set_status(self, kind: str, status: str, code: str | None = None) -> None:
        item = self._statuses[kind]
        item.status, item.error_code = status.lower(), code
        if status.upper() in {"OPERATIONAL", "DEMO"}:
            item.last_success = datetime.now(UTC)
        elif status.upper() in {"DEGRADED", "UNAVAILABLE"}:
            item.last_failure = datetime.now(UTC)

    def snapshot(self) -> dict[str, ProviderStatus]:
        return self._statuses.copy()
