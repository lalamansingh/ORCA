from app.db.base import Base
from app.db.models import MarineAlert, MarineRoute, MarineZone, PotentialFishingZone, RiskAssessmentRecord, SavedLocation


def test_initial_metadata_contains_persistence_models() -> None:
    expected = {"users", "conversations", "messages", "saved_locations", "marine_alerts", "potential_fishing_zones", "marine_zones", "marine_routes", "alert_subscriptions", "marine_query_logs", "data_source_logs", "risk_assessment_records"}
    assert expected.issubset(Base.metadata.tables)


def test_spatial_models_use_postgis_geometry_columns() -> None:
    assert SavedLocation.__table__.c.geometry.type.geometry_type == "POINT"
    assert PotentialFishingZone.__table__.c.geometry.type.geometry_type == "GEOMETRY"
    assert PotentialFishingZone.__table__.c.centroid.type.geometry_type == "POINT"
    assert MarineZone.__table__.c.geometry.type.geometry_type == "MULTIPOLYGON"
    assert MarineRoute.__table__.c.geometry.type.geometry_type == "LINESTRING"
    assert MarineAlert.__table__.c.geometry.type.geometry_type == "GEOMETRY"
    assert MarineAlert.__table__.c.forecast_track.type.geometry_type == "LINESTRING"
    assert RiskAssessmentRecord.__table__.c.score.nullable is True
