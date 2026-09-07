from datetime import datetime
from enum import StrEnum
from typing import Any
from pydantic import BaseModel,Field

class GeofenceStatus(StrEnum):
    CLEAR="CLEAR"; CAUTION="CAUTION"; RESTRICTED="RESTRICTED"; PROHIBITED="PROHIBITED"; UNKNOWN="UNKNOWN"; UNAVAILABLE="UNAVAILABLE"; DEMO="DEMO"
class ZoneSummary(BaseModel):
    id:str; name:str; zone_type:str; classification:str; distance_to_boundary_km:float|None=None; authority:str|None=None; source:str; source_url:str|None=None; legal_reference:str|None=None; restrictions:list[dict[str,Any]]=Field(default_factory=list)
class GeofenceAssessment(BaseModel):
    location:dict[str,float]; overall_status:GeofenceStatus; inside_zones:list[ZoneSummary]=Field(default_factory=list); nearby_zones:list[ZoneSummary]=Field(default_factory=list); nearest_boundary:ZoneSummary|None=None; warnings:list[str]=Field(default_factory=list); restrictions:list[dict[str,Any]]=Field(default_factory=list); evidence:list[dict[str,Any]]=Field(default_factory=list); assessed_at:datetime; data_status:str; limitations:list[str]=Field(default_factory=list)
class GeofenceCheckRequest(BaseModel):
    latitude:float=Field(ge=-90,le=90); longitude:float=Field(ge=-180,le=180); activity:str="UNKNOWN"; assessment_time:datetime|None=None; radius_km:float=Field(10,gt=0,le=500)
