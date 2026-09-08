from datetime import datetime
from enum import StrEnum
from typing import Any, TypedDict
from uuid import UUID
from pydantic import BaseModel, Field
from app.planner.models import ExecutionPlan, PlanStep, PlannerIntent


class AgentStatus(StrEnum): SUCCESS="SUCCESS"; PARTIAL="PARTIAL"; FAILED="FAILED"; SKIPPED="SKIPPED"; UNAVAILABLE="UNAVAILABLE"; BLOCKED="BLOCKED"
class OrchestrationStatus(StrEnum): SUCCESS="SUCCESS"; PARTIAL="PARTIAL"; FAILED="FAILED"; NEEDS_CLARIFICATION="NEEDS_CLARIFICATION"; UNSUPPORTED="UNSUPPORTED"
class AgentResult(BaseModel):
    agent: str; step_id: str; status: AgentStatus; data: dict[str,Any]=Field(default_factory=dict); evidence: list[dict[str,Any]]=Field(default_factory=list); warnings: list[str]=Field(default_factory=list); errors: list[dict[str,Any]]=Field(default_factory=list); started_at: datetime; completed_at: datetime; duration_ms: float
class OrchestrationError(BaseModel): code: str; step_id: str|None=None; agent: str|None=None; message: str; retryable: bool=False; provider: str|None=None
class MapAction(BaseModel): action: str; layer: str|None=None; feature_id: str|None=None; latitude: float|None=None; longitude: float|None=None
class ORCAState(TypedDict, total=False):
    query_id: str; trace_id: str; raw_query: str; language: str; intent: str; execution_plan: dict[str,Any]; selected_location: dict[str,Any]|None; requested_time: str|None; weather: dict[str,Any]|None; marine: dict[str,Any]|None; alerts: dict[str,Any]|None; risk: dict[str,Any]|None; pfz: dict[str,Any]|None; pfz_recommendation:dict[str,Any]|None; ocean_products: dict[str,Any]|None; geospatial: dict[str,Any]|None; geofence: dict[str,Any]|None; route: dict[str,Any]|None; map_actions: list[dict[str,Any]]; evidence: list[dict[str,Any]]; step_results: dict[str,dict[str,Any]]; errors: list[dict[str,Any]]; warnings: list[str]; execution_status: str; started_at: str; completed_at: str|None
class OrchestrationResult(BaseModel):
    query_id: UUID; trace_id: str; status: OrchestrationStatus; intent: PlannerIntent; location: dict[str,Any]|None=None; requested_time: str|None=None; data: dict[str,Any]=Field(default_factory=dict); evidence: list[dict[str,Any]]=Field(default_factory=list); step_results: list[AgentResult]=Field(default_factory=list); warnings: list[str]=Field(default_factory=list); errors: list[OrchestrationError]=Field(default_factory=list); map_actions: list[MapAction]=Field(default_factory=list); started_at: datetime; completed_at: datetime; duration_ms: float; clarification_questions: list[str]=Field(default_factory=list)
