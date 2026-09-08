import pytest
from app.core.system_mode import SystemDataMode,derive_system_mode
from app.demo.scenarios import DemoScenarioRegistry
from app.llm.models import ORCAFactContext,ResponseDraft
from app.services.grounded_response_validator import GroundedResponseValidator
from app.services.rate_limiter import RateLimiter

def test_system_modes_are_explicit():
    assert derive_system_mode(["OPERATIONAL"])==SystemDataMode.LIVE
    assert derive_system_mode(["DEMO"])==SystemDataMode.DEMO
    assert derive_system_mode(["DEMO","OPERATIONAL"])==SystemDataMode.MIXED
    assert derive_system_mode(["UNAVAILABLE","OPERATIONAL"])==SystemDataMode.DEGRADED
def test_demo_registry_is_stable_and_complete():
    first=DemoScenarioRegistry().list();second=DemoScenarioRegistry().list()
    assert [item.model_dump() for item in first]==[item.model_dump() for item in second]
    assert len(first)==8 and len({item.id for item in first})==8
def test_rate_limiter_is_bounded():
    limiter=RateLimiter();assert limiter.allow("user:endpoint",2);assert limiter.allow("user:endpoint",2);assert not limiter.allow("user:endpoint",2)
def test_high_risk_response_cannot_claim_safe():
    draft=ResponseDraft(answer="It is completely safe to go.")
    with pytest.raises(ValueError,match="LLM_SAFETY_CONTRADICTION"):GroundedResponseValidator().validate(draft,ORCAFactContext(risk={"level":"HIGH"}))
def test_map_actions_are_allowlisted():
    draft=ResponseDraft(answer="Conditions are available.",map_actions=[{"action":"RUN_JS","code":"alert(1)"},{"action":"SHOW_LAYER","layer":"pfz"}])
    result=GroundedResponseValidator().validate(draft,ORCAFactContext())
    assert result.map_actions==[{"action":"SHOW_LAYER","layer":"pfz"}]
