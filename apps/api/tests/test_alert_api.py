from datetime import UTC, datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.schemas.alerts import AlertListResponse, AlertSummary
from app.schemas.evidence import Location


class FakeAlertService:
    async def list_alerts(self, **_kwargs):
        return AlertListResponse(location=Location(latitude=13, longitude=80), status="complete", result_state="NO_ACTIVE_ALERTS", alerts=[], summary=AlertSummary(), sources=[], retrieved_at=datetime.now(UTC))
    async def detail(self, *_args): return None


def test_alert_list_and_active_routes_return_explicit_empty_state() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.alerts.alert_service", return_value=FakeAlertService()):
        response = client.get("/api/v1/alerts?latitude=13&longitude=80")
        active = client.get("/api/v1/alerts/active?latitude=13&longitude=80")
    assert response.status_code == 200
    assert active.json()["result_state"] == "NO_ACTIVE_ALERTS"


def test_alert_routes_validate_coordinates_and_clean_missing_detail() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.alerts.alert_service", return_value=FakeAlertService()):
        assert client.get("/api/v1/alerts?latitude=91&longitude=80").status_code == 422
        missing = client.get("/api/v1/alerts/0f5586b8-faf4-4e24-b05f-8e09c2e79f57")
    assert missing.status_code == 404
    assert missing.json()["error"]["message"] == "Marine alert not found."
