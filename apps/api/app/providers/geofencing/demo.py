from app.providers.geofencing.base import GeofenceFeature,GeofenceProvider
class DemoGeofenceProvider(GeofenceProvider):
    name="ORCA Demo Geofence"
    async def get_zones(self)->list[GeofenceFeature]:return []
    async def health_status(self)->str:return "DEMO"
