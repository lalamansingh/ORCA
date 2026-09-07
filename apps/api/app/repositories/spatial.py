"""Spatial repository operations backed by PostGIS; no public endpoint yet."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography
from app.db.models import MarineZone, PotentialFishingZone

def _point(longitude: float, latitude: float):
    return func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)

class PFZRepository:
    def __init__(self, session: AsyncSession): self.session = session
    async def nearest(self, *, latitude: float, longitude: float) -> PotentialFishingZone | None:
        point = _point(longitude, latitude)
        distance = func.ST_Distance(PotentialFishingZone.centroid.cast(Geography), point.cast(Geography))
        return await self.session.scalar(select(PotentialFishingZone).order_by(distance).limit(1))

class MarineZoneRepository:
    def __init__(self, session: AsyncSession): self.session = session
    async def containing(self, *, latitude: float, longitude: float) -> list[MarineZone]:
        point = _point(longitude, latitude)
        return list((await self.session.scalars(select(MarineZone).where(func.ST_Contains(MarineZone.geometry, point)))).all())
    async def nearby(self,*,latitude:float,longitude:float,radius_km:float)->list[tuple[MarineZone,float]]:
        point=_point(longitude,latitude);zone_geography=MarineZone.geometry.cast(Geography);point_geography=point.cast(Geography)
        distance=func.ST_Distance(zone_geography,point_geography)
        rows=await self.session.execute(select(MarineZone,distance.label("distance_m")).where(func.ST_DWithin(zone_geography,point_geography,radius_km*1000)).order_by(distance))
        return [(zone,float(distance_m)) for zone,distance_m in rows.all()]
