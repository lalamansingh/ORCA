"""Small deterministic DEMO grid for UI and sampling tests, never satellite observations."""
from datetime import UTC, datetime

from app.domain.ocean_products import OceanProduct, OceanProductStatus, OceanQuality
from app.providers.ocean_products.base import OceanProductProvider
from app.schemas.evidence import Location
from app.schemas.ocean_products import OceanProductMetadata, OceanSample

BOUNDS = (79.7, 12.5, 81.2, 13.7)


class DemoOceanProductProvider(OceanProductProvider):
    name = "ORCA Demo Ocean Grid"

    async def metadata(self, product: OceanProduct) -> OceanProductMetadata:
        now = datetime.now(UTC)
        chlorophyll = product == OceanProduct.CHLOROPHYLL_A
        return OceanProductMetadata(product=product, status=OceanProductStatus.DEMO, provider=self.name, dataset="Small Chennai coastal demonstration grid", units="mg/m³" if chlorophyll else "°C", valid_time=now, retrieved_at=now, spatial_resolution="~10 km demonstration cells", temporal_resolution=None, bounding_box=BOUNDS, quality_notes="DEMO DATA — includes a no-data cell for interface testing.", access_notes="Not satellite-derived; never use for operational decisions.", map_access={"kind": "demo_contours", "opacity_default": 0.62, "log_scale": chlorophyll})

    async def sample(self, product: OceanProduct, latitude: float, longitude: float) -> OceanSample:
        metadata = await self.metadata(product)
        if not (BOUNDS[0] <= longitude <= BOUNDS[2] and BOUNDS[1] <= latitude <= BOUNDS[3]):
            return OceanSample(product=product, value=None, unit=metadata.units, status=OceanProductStatus.DEMO, quality=OceanQuality.NO_DATA, valid_time=metadata.valid_time, retrieved_at=metadata.retrieved_at, provider=self.name, sample_method="nearest demonstration grid cell", evidence={"reason": "Outside demonstration grid extent."})
        grid_lat, grid_lon = round(latitude * 10) / 10, round(longitude * 10) / 10
        if (grid_lat, grid_lon) == (13.3, 80.6):
            value, quality = None, OceanQuality.NO_DATA
        elif product == OceanProduct.SEA_SURFACE_TEMPERATURE:
            value, quality = round(28.0 + ((grid_lat - 12.5) * .7) + ((grid_lon - 79.7) * .35), 2), OceanQuality.GOOD
        else:
            value, quality = round(0.18 + ((grid_lat - 12.5) * .22) + ((grid_lon - 79.7) * .09), 3), OceanQuality.ACCEPTABLE
        return OceanSample(product=product, value=value, unit=metadata.units, status=OceanProductStatus.DEMO, quality=quality, valid_time=metadata.valid_time, retrieved_at=metadata.retrieved_at, provider=self.name, sampled_location=Location(latitude=grid_lat, longitude=grid_lon), distance_to_grid_point_km=None, sample_method="nearest demonstration grid cell", evidence={"parameter": product.value, "provider": self.name, "quality": quality.value, "demo": True})
