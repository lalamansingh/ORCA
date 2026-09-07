from dataclasses import dataclass
from app.providers.geofencing.base import GeofenceProvider

@dataclass
class GeofenceIngestionReport:
    source:str;features_fetched:int=0;created:int=0;updated:int=0;expired:int=0;rejected:int=0;geometry_errors:int=0;status:str="NOT_CONNECTED"
class GeofenceIngestionService:
    """Reject-first ingestion boundary; database upsert follows source approval."""
    def __init__(self,provider:GeofenceProvider):self.provider=provider
    async def refresh(self)->GeofenceIngestionReport:
        status=await self.provider.health_status()
        if status not in {"OPERATIONAL","DEMO"}:return GeofenceIngestionReport(source=self.provider.name,status=status)
        features=await self.provider.get_zones();rejected=sum(item.crs!="EPSG:4326" or item.geometry.get("type") not in {"Polygon","MultiPolygon","LineString","MultiLineString"} for item in features)
        return GeofenceIngestionReport(source=self.provider.name,features_fetched=len(features),rejected=rejected,geometry_errors=rejected,status=status)
