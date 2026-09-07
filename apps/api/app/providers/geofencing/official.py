from app.providers.geofencing.base import GeofenceFeature,GeofenceProvider
class OfficialGeofenceProvider(GeofenceProvider):
    """Placeholder until an authoritative reusable geometry feed is verified."""
    name="Official maritime geofence sources"
    async def get_zones(self)->list[GeofenceFeature]:return []
    async def health_status(self)->str:return "NOT_CONNECTED"
