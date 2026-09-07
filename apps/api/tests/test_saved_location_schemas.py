import pytest
from pydantic import ValidationError

from app.db.models import User
from app.schemas.geojson import GeoJSONFeature, GeoJSONFeatureCollection
from app.schemas.persistence import SavedLocationCreate
from app.services.saved_locations import SavedLocationService


def test_saved_location_accepts_valid_postgis_point_coordinates() -> None:
    location = SavedLocationCreate(name="Home Harbour", location_type="HOME_HARBOUR", latitude=13.0827, longitude=80.2707)
    assert (location.latitude, location.longitude) == (13.0827, 80.2707)


@pytest.mark.parametrize("latitude,longitude", [(90.1, 80), (-90.1, 80), (13, 180.1), (13, -180.1)])
def test_saved_location_rejects_invalid_coordinates(latitude: float, longitude: float) -> None:
    with pytest.raises(ValidationError):
        SavedLocationCreate(name="Invalid", location_type="CUSTOM", latitude=latitude, longitude=longitude)


def test_geojson_feature_collection_supports_map_geometry() -> None:
    collection = GeoJSONFeatureCollection(features=[GeoJSONFeature(geometry={"type": "Point", "coordinates": [80.2707, 13.0827]})])
    assert collection.features[0].geometry.type == "Point"


class RecordingSession:
    def __init__(self) -> None:
        self.added = None

    def add(self, value: object) -> None:
        self.added = value

    async def commit(self) -> None:
        return None

    async def refresh(self, _value: object) -> None:
        return None


@pytest.mark.asyncio
async def test_saved_location_service_creates_longitude_latitude_postgis_point() -> None:
    session = RecordingSession()
    user = User(email="owner@example.com")
    item = await SavedLocationService(session).create(
        user,
        SavedLocationCreate(name="Home", location_type="HOME_HARBOUR", latitude=13.0827, longitude=80.2707),
    )
    assert item is session.added
    assert item.geometry.data == "POINT(80.2707 13.0827)"
