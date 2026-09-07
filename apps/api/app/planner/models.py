from enum import StrEnum
from typing import Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.llm.models import QueryExtractionResult


class PlannerTool(StrEnum):
    WEATHER="WEATHER"; MARINE="MARINE"; ALERTS="ALERTS"; RISK="RISK"; PFZ="PFZ"; OCEAN_PRODUCTS="OCEAN_PRODUCTS"; GEOSPATIAL="GEOSPATIAL"; GEOFENCE="GEOFENCE"; MAP="MAP"
class PlannerIntent(StrEnum):
    WEATHER_QUERY="WEATHER_QUERY"; MARINE_CONDITIONS_QUERY="MARINE_CONDITIONS_QUERY"; MARINE_RISK_QUERY="MARINE_RISK_QUERY"; PFZ_QUERY="PFZ_QUERY"; ALERT_QUERY="ALERT_QUERY"; OCEAN_PRODUCTIVITY_QUERY="OCEAN_PRODUCTIVITY_QUERY"; GEOFENCE_QUERY="GEOFENCE_QUERY"; MAP_QUERY="MAP_QUERY"; ROUTE_QUERY="ROUTE_QUERY"; MULTI_INTENT="MULTI_INTENT"; GENERAL_INFORMATION="GENERAL_INFORMATION"; UNKNOWN="UNKNOWN"
class PlanStepStatus(StrEnum): PENDING="PENDING"; UNSUPPORTED="UNSUPPORTED"
class CapabilityStatus(StrEnum): AVAILABLE="AVAILABLE"; PARTIAL="PARTIAL"; NOT_IMPLEMENTED="NOT_IMPLEMENTED"; UNAVAILABLE="UNAVAILABLE"
class ClarificationType(StrEnum): MISSING_LOCATION="MISSING_LOCATION"; AMBIGUOUS_TIME="AMBIGUOUS_TIME"; AMBIGUOUS_TARGET="AMBIGUOUS_TARGET"

class IntentSignals(BaseModel):
    mentions_safe: bool=False; mentions_pfz: bool=False; mentions_weather: bool=False; mentions_waves: bool=False; mentions_alert: bool=False; mentions_chlorophyll: bool=False; mentions_geofence: bool=False; mentions_map: bool=False; mentions_route: bool=False
class IntentClassification(BaseModel):
    primary_intent: PlannerIntent; secondary_intents: list[PlannerIntent]=Field(default_factory=list); confidence: float=Field(ge=0,le=1); signals: IntentSignals; safety_sensitive: bool=False; classification_source: str="RULES"; conflicts: list[str]=Field(default_factory=list)
class ClarificationRequest(BaseModel):
    type: ClarificationType; question: str; required_field: str; options: list[str]=Field(default_factory=list)
class PlanStep(BaseModel):
    id: str; tool: PlannerTool; operation: str; inputs: dict[str, Any]=Field(default_factory=dict); depends_on: list[str]=Field(default_factory=list); required: bool=True; parallelizable: bool=False; reason_code: str; status: PlanStepStatus=PlanStepStatus.PENDING
class ExecutionPlan(BaseModel):
    query_id: UUID; primary_intent: PlannerIntent; secondary_intents: list[PlannerIntent]=Field(default_factory=list); requires_location: bool=False; location: dict[str, Any]|None=None; requested_time: str|None=None; time_mode: str="CURRENT"; steps: list[PlanStep]=Field(default_factory=list); parallel_groups: list[list[str]]=Field(default_factory=list); dependencies: dict[str,list[str]]=Field(default_factory=dict); needs_clarification: bool=False; clarification_requests: list[ClarificationRequest]=Field(default_factory=list); clarification_questions: list[str]=Field(default_factory=list); estimated_tool_calls: int=0; safety_sensitive: bool=False; response_language: str="en"; capability_status: CapabilityStatus=CapabilityStatus.AVAILABLE; classification: IntentClassification; metadata: dict[str,Any]=Field(default_factory=dict)
