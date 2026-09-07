from datetime import UTC,datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.spatial import MarineZoneRepository
from app.schemas.geofence import GeofenceAssessment,GeofenceStatus,ZoneSummary

LEGAL_NOTICE="ORCA provides geospatial decision support from available mapped sources and is not a substitute for official maritime/legal clearance."
class GeofenceService:
    def __init__(self,session:AsyncSession,boundary_caution_km:float=5):self.repository=MarineZoneRepository(session);self.caution_km=boundary_caution_km
    async def check_point(self,latitude:float,longitude:float,activity:str="UNKNOWN",assessment_time:datetime|None=None,radius_km:float=10)->GeofenceAssessment:
        now=assessment_time or datetime.now(UTC);inside=await self.repository.containing(latitude=latitude,longitude=longitude);nearby=await self.repository.nearby(latitude=latitude,longitude=longitude,radius_km=radius_km)
        def active(zone):
            meta=zone.metadata_ or {};start=meta.get("valid_from");end=meta.get("valid_until")
            return not ((start and now<datetime.fromisoformat(start)) or (end and now>datetime.fromisoformat(end)))
        inside=[zone for zone in inside if active(zone)];nearby=[(zone,distance) for zone,distance in nearby if active(zone)]
        if not inside and not nearby:return GeofenceAssessment(location={"latitude":latitude,"longitude":longitude},overall_status=GeofenceStatus.UNAVAILABLE,assessed_at=now,data_status="UNAVAILABLE",warnings=["GEOFENCE_DATA_UNAVAILABLE"],limitations=[LEGAL_NOTICE])
        def summary(zone,distance=None):
            meta=zone.metadata_ or {};classification=meta.get("classification","CAUTION" if zone.zone_type.value in {"MARINE_PROTECTED_AREA","ECOLOGICALLY_SENSITIVE_ZONE"} else "UNKNOWN")
            return ZoneSummary(id=str(zone.id),name=zone.name,zone_type=zone.zone_type.value,classification=classification,distance_to_boundary_km=None if distance is None else round(distance/1000,3),authority=meta.get("authority"),source=zone.source,source_url=meta.get("source_url"),legal_reference=meta.get("legal_reference"),restrictions=meta.get("restrictions",[]))
        contained=[summary(zone,0) for zone in inside];near=[summary(zone,distance) for zone,distance in nearby if zone.id not in {item.id for item in inside}]
        classes={item.classification for item in contained};overall=GeofenceStatus.PROHIBITED if "PROHIBITED" in classes else GeofenceStatus.RESTRICTED if "RESTRICTED" in classes else GeofenceStatus.CAUTION if contained or any((item.distance_to_boundary_km or 999)<=self.caution_km for item in near) else GeofenceStatus.CLEAR
        evidence=[{"evidence_id":f"zone:{item.id}","source":item.source,"authority":item.authority,"legal_reference":item.legal_reference,"kind":"SOURCE_RULE"} for item in contained+near]
        return GeofenceAssessment(location={"latitude":latitude,"longitude":longitude},overall_status=overall,inside_zones=contained,nearby_zones=near,nearest_boundary=near[0] if near else (contained[0] if contained else None),warnings=[f"Within {self.caution_km:g} km of a mapped zone boundary."] if overall==GeofenceStatus.CAUTION else [],restrictions=[rule for item in contained for rule in item.restrictions if rule.get("activity") in {activity,"ALL","UNKNOWN"}],evidence=evidence,assessed_at=now,data_status="OPERATIONAL",limitations=[LEGAL_NOTICE])
