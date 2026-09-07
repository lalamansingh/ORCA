from datetime import UTC, datetime

from app.domain.pfz import PFZStatus
from app.providers.pfz.incois import IncoisPFZProvider
from app.services.pfz_service import bearing


def test_incois_normalizes_multiline_and_preserves_unknown_expiry() -> None:
    provider = IncoisPFZProvider(None, "https://example.test/wfs", 1, 48, 10)  # type: ignore[arg-type]
    item = provider._normalize({"id": "pfz.7", "properties": {"Year": "2026", "Julian_day": "250", "UID": "abc", "Sno": "007", "Length": "12"}, "geometry": {"type": "MultiLineString", "coordinates": [[[80.0, 13.0], [80.1, 13.1]]]}}, datetime(2026, 9, 7, tzinfo=UTC), "source-time")
    assert item.external_id == "incois-wfs:2026:250:abc"
    assert item.status == PFZStatus.CURRENT
    assert item.valid_until is None
    assert item.geometry.type == "MultiLineString"


def test_bearing_uses_nearest_geometry_point() -> None:
    degrees, cardinal = bearing(13.0, 80.0, 13.0, 81.0)
    assert 89 < degrees < 91
    assert cardinal == "E"
