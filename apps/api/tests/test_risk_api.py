from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.core.config import Settings
from app.main import create_app
from app.risk.models import MarineRiskAssessment, RiskDataQuality, RiskLevel, RiskProvenanceMode, RiskTimelinePoint, RiskTimelineResponse
from app.schemas.evidence import Location

NOW = datetime(2026, 9, 7, 6, tzinfo=UTC)


def assessment(level: RiskLevel = RiskLevel.LOW) -> MarineRiskAssessment:
    score = None if level == RiskLevel.UNAVAILABLE else {RiskLevel.LOW: 0, RiskLevel.MODERATE: 25, RiskLevel.HIGH: 50, RiskLevel.EXTREME: 75}[level]
    return MarineRiskAssessment(
        score=score, level=level, assessment_time=NOW, location=Location(latitude=13.08, longitude=80.27),
        recommendation="Template recommendation", summary="Template summary", factors=[], critical_factors=[],
        data_quality=RiskDataQuality.INSUFFICIENT if level == RiskLevel.UNAVAILABLE else RiskDataQuality.GOOD,
        missing_inputs=["wave_height_m"] if level == RiskLevel.UNAVAILABLE else [], evidence=[], sources=[],
        provenance_mode=RiskProvenanceMode.UNAVAILABLE if level == RiskLevel.UNAVAILABLE else RiskProvenanceMode.LIVE,
        risk_model_version="orca-risk-v1", calculated_at=NOW,
    )


class FakeRiskService:
    def __init__(self, result: MarineRiskAssessment | None = None) -> None:
        self.result = result or assessment()
        self.calls: list[dict[str, object]] = []

    async def evaluate(self, **kwargs):  # type: ignore[no-untyped-def]
        self.calls.append(kwargs)
        return self.result

    async def timeline(self, **kwargs):  # type: ignore[no-untyped-def]
        return RiskTimelineResponse(location=Location(latitude=13.08, longitude=80.27), generated_at=NOW, hours=24, interval_hours=3, risk_model_version="orca-risk-v1", points=[RiskTimelinePoint(assessment_time=NOW, score=0, level=RiskLevel.LOW, data_quality=RiskDataQuality.GOOD)])


def app_client(service: FakeRiskService) -> tuple[TestClient, object]:
    app = create_app(Settings(app_env="test", debug=False))
    user = SimpleNamespace(id=uuid4())
    app.dependency_overrides[get_current_user] = lambda: user
    return TestClient(app), user


def test_quick_risk_endpoint_returns_versioned_response_schema() -> None:
    fake = FakeRiskService(assessment(RiskLevel.HIGH))
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.risk.risk_service", return_value=fake):
        response = client.get("/api/v1/risk?latitude=13.08&longitude=80.27")
    assert response.status_code == 200
    assert response.json()["level"] == "HIGH"
    assert response.json()["risk_model_version"] == "orca-risk-v1"


def test_risk_coordinates_are_validated() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client:
        assert client.get("/api/v1/risk?latitude=91&longitude=80").status_code == 422
        assert client.get("/api/v1/risk/timeline?latitude=13&longitude=181").status_code == 422


def test_authenticated_post_evaluates_current_and_future_requests() -> None:
    fake = FakeRiskService()
    client, user = app_client(fake)
    client.cookies.set("orca_csrf", "risk-test")
    with client, patch("app.api.v1.endpoints.risk.risk_service", return_value=fake):
        current = client.post("/api/v1/risk/evaluate", json={"latitude": 13.08, "longitude": 80.27}, headers={"X-CSRF-Token": "risk-test"})
        future = client.post("/api/v1/risk/evaluate", json={"latitude": 13.08, "longitude": 80.27, "assessment_time": "2026-09-07T12:00:00Z"}, headers={"X-CSRF-Token": "risk-test"})
    assert current.status_code == 200 and future.status_code == 200
    assert fake.calls[0]["user_id"] == user.id
    assert fake.calls[0]["assessment_time"] is None
    assert fake.calls[1]["assessment_time"] == NOW.replace(hour=12)


def test_post_requires_authentication_and_csrf() -> None:
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client:
        missing_csrf = client.post("/api/v1/risk/evaluate", json={"latitude": 13, "longitude": 80})
        client.cookies.set("orca_csrf", "risk-test")
        missing_auth = client.post("/api/v1/risk/evaluate", json={"latitude": 13, "longitude": 80}, headers={"X-CSRF-Token": "risk-test"})
    assert missing_csrf.status_code == 403
    assert missing_auth.status_code == 401


def test_insufficient_data_is_an_explicit_unavailable_result() -> None:
    fake = FakeRiskService(assessment(RiskLevel.UNAVAILABLE))
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.risk.risk_service", return_value=fake):
        response = client.get("/api/v1/risk?latitude=13&longitude=80")
    assert response.status_code == 200
    assert response.json()["score"] is None
    assert response.json()["data_quality"] == "INSUFFICIENT"
    assert response.json()["missing_inputs"] == ["wave_height_m"]


def test_critical_risk_is_preserved_by_the_api_contract() -> None:
    fake = FakeRiskService(assessment(RiskLevel.EXTREME))
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.risk.risk_service", return_value=fake):
        response = client.get("/api/v1/risk?latitude=13.08&longitude=80.27")
    assert response.status_code == 200
    assert response.json()["score"] == 75
    assert response.json()["level"] == "EXTREME"


def test_timeline_endpoint_reuses_the_risk_service_contract() -> None:
    fake = FakeRiskService()
    app = create_app(Settings(app_env="test", debug=False))
    with TestClient(app) as client, patch("app.api.v1.endpoints.risk.risk_service", return_value=fake):
        response = client.get("/api/v1/risk/timeline?latitude=13.08&longitude=80.27&hours=24&interval_hours=3")
    assert response.status_code == 200
    assert response.json()["points"][0]["level"] == "LOW"
