from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID
from pydantic import BaseModel,Field,model_validator

class RouteMode(StrEnum):LOWEST_RISK="LOWEST_RISK";BALANCED="BALANCED";SHORTEST_FEASIBLE="SHORTEST_FEASIBLE"
class RouteStatus(StrEnum):SUCCESS="SUCCESS";PARTIAL="PARTIAL";NO_FEASIBLE_ROUTE="NO_FEASIBLE_ROUTE";UNAVAILABLE="UNAVAILABLE";OUTSIDE_ROUTING_DOMAIN="OUTSIDE_ROUTING_DOMAIN";TARGET_RESTRICTED="TARGET_RESTRICTED";START_RESTRICTED="START_RESTRICTED";INSUFFICIENT_DATA="INSUFFICIENT_DATA";DEMO="DEMO"
class Coordinate(BaseModel):latitude:float=Field(ge=-90,le=90);longitude:float=Field(ge=-180,le=180)
class VesselProfile(BaseModel):type:str="UNSPECIFIED";cruising_speed_knots:float|None=Field(default=None,gt=0,le=80);max_recommended_wave_height:float|None=Field(default=None,gt=0);max_recommended_wind:float|None=Field(default=None,gt=0);draft_m:float|None=Field(default=None,gt=0)
class RouteRequest(BaseModel):
    start:Coordinate;destination:Coordinate;departure_time:datetime|None=None;route_mode:RouteMode=RouteMode.LOWEST_RISK;vessel_profile:VesselProfile|None=None;avoid_restricted:bool=True;avoid_high_risk:bool=True;max_detour_ratio:float=Field(2.5,ge=1,le=5);persist:bool=False
class RouteSegment(BaseModel):index:int;geometry:dict[str,Any];distance_km:float;risk_level:str="UNAVAILABLE";geofence_status:str="UNKNOWN";wave_height:float|None=None;wind_speed:float|None=None;alerts:list[dict[str,Any]]=Field(default_factory=list);cost:float;evidence_refs:list[str]=Field(default_factory=list)
class RouteResult(BaseModel):
    route_id:UUID|None=None;status:RouteStatus;route_mode:RouteMode;start:Coordinate;destination:Coordinate;geometry:dict[str,Any]|None=None;distance_km:float|None=None;direct_distance_km:float;detour_ratio:float|None=None;estimated_duration_minutes:int|None=None;departure_time:datetime|None=None;risk_summary:dict[str,Any]=Field(default_factory=dict);geofence_summary:dict[str,Any]=Field(default_factory=dict);alerts_summary:dict[str,Any]=Field(default_factory=dict);route_segments:list[RouteSegment]=Field(default_factory=list);warnings:list[str]=Field(default_factory=list);evidence:list[dict[str,Any]]=Field(default_factory=list);generated_at:datetime;model_version:str="orca-route-v1";data_quality:str="INSUFFICIENT";limitations:list[str]=Field(default_factory=list)
    @model_validator(mode="after")
    def successful_route_has_geometry(self):
        if self.status in {RouteStatus.SUCCESS,RouteStatus.PARTIAL,RouteStatus.DEMO} and self.geometry is None:raise ValueError("successful route requires geometry")
        return self
