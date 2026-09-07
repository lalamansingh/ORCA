from fastapi.testclient import TestClient
from pydantic import ValidationError
from unittest.mock import AsyncMock, patch

from app.core.config import Settings
from app.main import create_app
from app.schemas.common import Coordinates
from app.services.database_health import DatabaseHealth


def build_client() -> TestClient:
    settings = Settings(app_env="test", cors_origins="http://localhost:3000", debug=False)
    return TestClient(create_app(settings))


def test_api_info() -> None:
    response = build_client().get("/")

    assert response.status_code == 200
    assert response.json() == {
        "name": "ORCA Marine Intelligence API",
        "status": "running",
        "docs": "/docs",
    }


def test_health_returns_structured_status_and_request_id() -> None:
    with patch("app.api.v1.endpoints.health.check_database_health", new=AsyncMock(return_value=DatabaseHealth(status="unavailable", postgis=None))):
        response = build_client().get("/api/v1/health", headers={"X-Request-ID": "orca-test-42"})

    assert response.status_code == 200
    assert response.json() == {
        "status": "degraded",
        "service": "orca-api",
        "version": "0.1.0",
        "environment": "test",
        "dependencies": {
            "database": {"status": "unavailable", "postgis": None},
            "weather_provider": {"status": "not_checked", "last_success": None},
            "marine_provider": {"status": "not_checked", "last_success": None},
        },
    }
    assert response.headers["X-Request-ID"] == "orca-test-42"


def test_cors_allows_configured_frontend_origin() -> None:
    response = build_client().options(
        "/api/v1/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_coordinates_accept_valid_values() -> None:
    coordinates = Coordinates(latitude=13.08, longitude=80.27)
    assert coordinates.latitude == 13.08
    assert coordinates.longitude == 80.27


def test_coordinates_reject_invalid_latitude() -> None:
    try:
        Coordinates(latitude=90.1, longitude=80.27)
    except ValidationError:
        return
    raise AssertionError("Expected invalid latitude to be rejected")


def test_coordinates_reject_invalid_longitude() -> None:
    try:
        Coordinates(latitude=13.08, longitude=180.1)
    except ValidationError:
        return
    raise AssertionError("Expected invalid longitude to be rejected")
