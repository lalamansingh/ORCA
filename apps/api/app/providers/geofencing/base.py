from abc import ABC,abstractmethod
from datetime import datetime
from typing import Any
from pydantic import BaseModel,Field

class GeofenceFeature(BaseModel):
    external_id:str;name:str;zone_type:str;classification:str;geometry:dict[str,Any];crs:str="EPSG:4326";source:str;source_url:str;authority:str;dataset_version:str|None=None;legal_reference:str|None=None;valid_from:datetime|None=None;valid_until:datetime|None=None;restrictions:list[dict[str,Any]]=Field(default_factory=list);data_status:str="OPERATIONAL"
class GeofenceProvider(ABC):
    name:str
    @abstractmethod
    async def get_zones(self)->list[GeofenceFeature]:...
    @abstractmethod
    async def health_status(self)->str:...
