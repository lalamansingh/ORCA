from app.llm.models import LanguageDetectionResult,QueryExtractionResult
from app.planner.planner import QueryPlanner
from app.planner.models import PlannerIntent,PlannerTool
from fastapi.testclient import TestClient
from app.core.config import Settings
from app.main import create_app


def extraction(query:str,location:bool=True)->QueryExtractionResult:
    return QueryExtractionResult(raw_query=query,normalized_query=query,language=LanguageDetectionResult(language_code="en",language_name="English",confidence=.9),requires_location=location)


def test_safety_plan_has_parallel_sources_then_risk_dependency() -> None:
    plan=QueryPlanner().plan(extraction("Is it safe to go fishing tomorrow morning?"))
    assert plan.primary_intent == PlannerIntent.MARINE_RISK_QUERY
    assert [step.tool for step in plan.steps[:3]] == [PlannerTool.WEATHER,PlannerTool.MARINE,PlannerTool.ALERTS]
    assert plan.steps[-1].tool == PlannerTool.RISK
    assert set(plan.steps[-1].depends_on)=={"weather","marine","alerts"}
    assert plan.parallel_groups[0] == ["weather","marine","alerts"]


def test_pfz_without_location_requests_clarification() -> None:
    plan=QueryPlanner().plan(extraction("Nearest PFZ?",False))
    assert plan.needs_clarification
    assert plan.clarification_requests[0].required_field == "location"


def test_pfz_safety_chains_target_and_risk() -> None:
    plan=QueryPlanner().plan(extraction("Is nearest PFZ safe?"))
    assert {step.tool for step in plan.steps} == {PlannerTool.PFZ,PlannerTool.GEOSPATIAL,PlannerTool.WEATHER,PlannerTool.MARINE,PlannerTool.ALERTS,PlannerTool.RISK}
    assert plan.steps[-1].depends_on == ["weather","marine","alerts"]


def test_route_is_marked_unsupported_and_no_arbitrary_tool_is_allowed() -> None:
    plan=QueryPlanner().plan(extraction("Give me the safest route to the fishing zone?"))
    assert plan.capability_status.value == "NOT_IMPLEMENTED"
    assert all(step.tool in PlannerTool for step in plan.steps)
    assert any(step.status.value == "UNSUPPORTED" for step in plan.steps)


def test_general_information_has_no_provider_steps() -> None:
    plan=QueryPlanner().plan(extraction("What is PFZ?",False))
    assert plan.primary_intent == PlannerIntent.GENERAL_INFORMATION
    assert plan.steps == []


def test_plan_endpoint_uses_rules_fallback_when_llm_disabled() -> None:
    with TestClient(create_app(Settings(app_env="test", llm_enabled=False))) as client:
        response = client.post("/api/v1/ai/plan", json={"query": "Nearest PFZ dikhao"})
    assert response.status_code == 200
    assert response.json()["primary_intent"] == "PFZ_QUERY"
    assert [step["tool"] for step in response.json()["steps"]] == ["PFZ", "GEOSPATIAL"]
