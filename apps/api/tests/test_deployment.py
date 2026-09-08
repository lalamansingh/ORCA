from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.core.config import Settings
from app.main import create_app
from app.services.database_health import DatabaseHealth

HOSTED = dict(app_env="production", debug=False, jwt_secret_key="unique-secret-for-configuration-validation-1234", cookie_secure=True, cors_origins="https://orca.example", frontend_url="https://orca.example", database_url="postgresql://orca:secure-db-credential@db.example/orca")

@pytest.mark.parametrize("override", [{"debug": True}, {"cors_origins": "*"}, {"cors_origins": "https://orca.example/path"}, {"database_url": "postgresql://orca:orca_local_dev_password@db/orca"}, {"llm_enabled": True}, {"orca_demo_mode": True}, {"cookie_secure": False}, {"app_env": "typo"}])
def test_hosted_config_fails_closed(override):
    with pytest.raises(ValidationError): Settings(_env_file=None, **(HOSTED | override))

def test_platform_database_url_is_normalized():
    assert Settings(_env_file=None, **HOSTED).database_url.startswith("postgresql+asyncpg://")

@pytest.mark.parametrize("database,code", [(DatabaseHealth("healthy", True), 200), (DatabaseHealth("unavailable", None), 503), (DatabaseHealth("schema_mismatch", True), 503), (DatabaseHealth("healthy", False), 503)])
def test_readiness_http_status(database, code):
    with patch("app.api.v1.endpoints.health.check_database_health", new=AsyncMock(return_value=database)):
        with TestClient(create_app(Settings(_env_file=None, app_env="test"))) as client:
            assert client.get("/api/v1/health/ready").status_code == code
            assert client.get("/api/v1/health/live").status_code == 200

def test_cross_origin_csrf_and_production_debug_boundary():
    with TestClient(create_app(Settings(_env_file=None, **HOSTED)), base_url="https://api.example") as client:
        response = client.get("/api/v1/auth/csrf", headers={"Origin": "https://orca.example"})
        token = response.json()["csrf_token"]
        assert token == client.cookies.get("orca_csrf")
        assert response.headers["access-control-allow-origin"] == "https://orca.example"
        assert response.headers["cache-control"] == "no-store"
        assert "Secure" in response.headers["set-cookie"]
        assert client.post("/api/v1/auth/refresh").status_code == 403
        assert client.post("/api/v1/auth/refresh", headers={"X-CSRF-Token": token}).status_code == 401
        assert client.get("/metrics").status_code == 404
        assert client.post("/api/v1/ai/execute", json={"query": "weather"}).status_code == 404
        rejected = client.get("/api/v1/auth/csrf", headers={"Origin": "https://attacker.example"})
        assert "access-control-allow-origin" not in rejected.headers


def test_validation_does_not_reflect_password_input():
    with TestClient(create_app(Settings(_env_file=None, app_env="test"))) as client:
        response = client.post("/api/v1/auth/register", json={"email":"invalid", "password":"private123", "full_name":"test"})
        assert response.status_code == 422
        assert "private123" not in response.text
        assert all("input" not in error for error in response.json()["error"]["details"])

@pytest.mark.asyncio
async def test_future_question_does_not_execute_current_weather():
    from app.orchestrator.pipeline import ORCAQueryExecutionService
    from app.orchestrator.service import ORCAOrchestrator
    from app.orchestrator.registry import ORCAToolRegistry
    result = await ORCAQueryExecutionService(ORCAOrchestrator(ORCAToolRegistry())).execute("Is it safe tomorrow morning?", {"latitude":13.08,"longitude":80.27})
    assert result.status.value == "NEEDS_CLARIFICATION"
    assert not result.step_results and not result.data

@pytest.mark.asyncio
async def test_orchestration_timeout_is_partial_not_success():
    from app.orchestrator.pipeline import ORCAQueryExecutionService
    from app.orchestrator.service import ORCAOrchestrator
    from app.orchestrator.registry import ORCAToolRegistry
    orchestrator = ORCAOrchestrator(ORCAToolRegistry())
    with patch.object(orchestrator,"_run",new=AsyncMock(side_effect=TimeoutError)):
        result = await ORCAQueryExecutionService(orchestrator).execute("Show nearest PFZ", {"latitude":13.08,"longitude":80.27})
    assert result.status.value == "PARTIAL"
    assert result.errors[0].code == "ORCHESTRATION_TIMEOUT"

@pytest.mark.asyncio
async def test_pfz_database_failure_is_unavailable_not_empty():
    from app.services.pfz_service import PFZService
    from app.services.provider_status import ProviderStatusRegistry
    def unavailable_session(): raise ConnectionError("database unavailable")
    result = await PFZService([], unavailable_session, None, ProviderStatusRegistry()).nearest(13.08,80.27,100,5)
    assert result.status == "unavailable"
    assert result.result_state == "PFZ_PROVIDER_UNAVAILABLE"
    assert result.pfzs == []
