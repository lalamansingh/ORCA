from sqlalchemy import func, select
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geography

from app.db.models import MarineZone, PotentialFishingZone
from app.repositories.spatial import _point


def test_nearest_pfz_query_compiles_to_postgis_distance() -> None:
    point = _point(80.27, 13.08)
    distance = func.ST_Distance(PotentialFishingZone.centroid.cast(Geography), point.cast(Geography))
    sql = str(select(PotentialFishingZone).order_by(distance).limit(1).compile(dialect=postgresql.dialect()))
    assert "ST_Distance" in sql
    assert "potential_fishing_zones" in sql


def test_point_in_polygon_query_compiles_to_postgis_contains() -> None:
    sql = str(select(MarineZone).where(func.ST_Contains(MarineZone.geometry, _point(80.27, 13.08))).compile(dialect=postgresql.dialect()))
    assert "ST_Contains" in sql
    assert "marine_zones" in sql
