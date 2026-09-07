from datetime import UTC, datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.providers.errors import ProviderTimeoutError
from app.schemas.conditions import CombinedConditionsResponse
from app.schemas.evidence import DataSource, Location
from app.schemas.marine import MarineResponse
from app.schemas.weather import WeatherResponse

NOW = datetime.now(UTC)
LOCATION = Location(latitude=13.0, longitude=80.35)
SOURCE = DataSource(provider="Open-Meteo", dataset="Test Forecast")
WEATHER = WeatherResponse(location=LOCATION, current=None, timezone="Asia/Kolkata", source=SOURCE, retrieved_at=NOW)
MARINE = MarineResponse(location=LOCATION, current=None, timezone="Asia/Kolkata", source=SOURCE, retrieved_at=NOW)


class FakeService:
    def __init__(self, result):
        self.result = result

    async def get_conditions(self, *_args, **_kwargs):
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


def test_weather_and_marine_endpoints_return_normalized_schemas() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.conditions.services", return_value=(FakeService(WEATHER), FakeService(MARINE))):
        assert client.get("/api/v1/weather?latitude=13&longitude=80.35").json()["source"]["provider"] == "Open-Meteo"
        assert client.get("/api/v1/marine?latitude=13&longitude=80.35").json()["timezone"] == "Asia/Kolkata"


def test_conditions_endpoint_returns_partial_data() -> None:
    response = CombinedConditionsResponse(location=LOCATION, weather=WEATHER, marine=None, sources=[SOURCE], retrieved_at=NOW, status="partial", errors={"marine": "unavailable"})
    class CombinedFake:
        async def get_conditions(self, *_args, **_kwargs):
            return response
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.conditions.CombinedConditionsService", return_value=CombinedFake()), patch("app.api.v1.endpoints.conditions.services", return_value=(FakeService(WEATHER), FakeService(MARINE))):
        payload = client.get("/api/v1/conditions?latitude=13&longitude=80.35").json()
        assert payload["status"] == "partial" and payload["marine"] is None


def test_conditions_endpoints_validate_coordinates() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client:
        assert client.get("/api/v1/weather?latitude=91&longitude=80").status_code == 422
        assert client.get("/api/v1/marine?latitude=13&longitude=-181").status_code == 422


def test_provider_timeout_is_mapped_without_stack_trace() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.conditions.services", return_value=(FakeService(ProviderTimeoutError("secret detail")), FakeService(MARINE))):
        response = client.get("/api/v1/weather?latitude=13&longitude=80")
        assert response.status_code == 504
        assert response.json()["error"]["message"] == "Forecast provider timed out."
