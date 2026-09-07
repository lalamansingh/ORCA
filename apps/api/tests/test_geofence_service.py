from types import SimpleNamespace
import pytest
from app.services.geofence_service import GeofenceService

@pytest.mark.asyncio
async def test_no_source_is_unavailable():
    service=GeofenceService(None);service.repository=SimpleNamespace(containing=lambda **kwargs:_result([]),nearby=lambda **kwargs:_result([]))
    result=await service.check_point(10,75)
    assert result.overall_status=="UNAVAILABLE"

@pytest.mark.asyncio
async def test_mpa_without_activity_rule_is_caution():
    zone=SimpleNamespace(id="z1",name="Test MPA",zone_type=SimpleNamespace(value="MARINE_PROTECTED_AREA"),source="Official fixture",metadata_={"authority":"Test authority"})
    service=GeofenceService(None);service.repository=SimpleNamespace(containing=lambda **kwargs:_result([zone]),nearby=lambda **kwargs:_result([(zone,0)]))
    result=await service.check_point(10,75,activity="FISHING")
    assert result.overall_status=="CAUTION"
    assert result.inside_zones[0].classification=="CAUTION"

async def _result(value):return value
