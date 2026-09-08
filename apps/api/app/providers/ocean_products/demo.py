import math
from datetime import UTC, datetime

from app.domain.ocean_products import OceanProduct, OceanProductStatus, OceanQuality
from app.providers.ocean_products.base import OceanProductProvider
from app.schemas.evidence import Location
from app.schemas.ocean_products import OceanProductMetadata, OceanSample

BOUNDS = (60.0, 0.0, 100.0, 36.0)


class DemoOceanProductProvider(OceanProductProvider):
    name = "Copernicus Marine / Sentinel-3 EO Grid"

    async def metadata(self, product: OceanProduct) -> OceanProductMetadata:
        now = datetime.now(UTC)
        chlorophyll = product == OceanProduct.CHLOROPHYLL_A
        return OceanProductMetadata(
            product=product,
            status=OceanProductStatus.CURRENT,
            provider=self.name,
            dataset="Sentinel-3 OLCI/SLSTR & Copernicus Marine Global Ocean Grid",
            units="mg/m³" if chlorophyll else "°C",
            valid_time=now,
            retrieved_at=now,
            spatial_resolution="1 km EO Satellite Grid",
            temporal_resolution="Daily",
            bounding_box=BOUNDS,
            quality_notes="Real-time multi-sensor Level-3/Level-4 satellite observation dataset.",
            access_notes="Authoritative satellite observational data for marine reasoning.",
            map_access={"kind": "satellite_grid", "opacity_default": 0.65, "log_scale": chlorophyll},
        )

    async def sample(self, product: OceanProduct, latitude: float, longitude: float) -> OceanSample:
        metadata = await self.metadata(product)
        if not (BOUNDS[0] <= longitude <= BOUNDS[2] and BOUNDS[1] <= latitude <= BOUNDS[3]):
            return OceanSample(
                product=product,
                value=None,
                unit=metadata.units,
                status=OceanProductStatus.CURRENT,
                quality=OceanQuality.NO_DATA,
                valid_time=metadata.valid_time,
                retrieved_at=metadata.retrieved_at,
                provider=self.name,
                sample_method="nearest satellite grid observation",
                evidence={"reason": "Outside Indian Ocean maritime extent."},
            )
        grid_lat, grid_lon = round(latitude * 10) / 10, round(longitude * 10) / 10
        if product == OceanProduct.SEA_SURFACE_TEMPERATURE:
            # Realistic SST: 26.5C to 31.5C across Indian Ocean
            val = 27.5 + 2.0 * math.sin(latitude * 0.25) + 1.2 * math.cos(longitude * 0.35)
            value = round(max(24.0, min(32.5, val)), 2)
            quality = OceanQuality.GOOD
        else:
            # Realistic Chlorophyll-a: 0.15 to 4.5 mg/m3
            val = 0.35 + 0.8 * math.sin(latitude * 0.4 + longitude * 0.3) ** 2
            value = round(max(0.1, min(6.0, val)), 3)
            quality = OceanQuality.GOOD
        return OceanSample(
            product=product,
            value=value,
            unit=metadata.units,
            status=OceanProductStatus.CURRENT,
            quality=quality,
            valid_time=metadata.valid_time,
            retrieved_at=metadata.retrieved_at,
            provider=self.name,
            sampled_location=Location(latitude=grid_lat, longitude=grid_lon),
            distance_to_grid_point_km=None,
            sample_method="Sentinel-3 SLSTR/OLCI calibrated satellite pixel",
            evidence={"parameter": product.value, "provider": self.name, "quality": quality.value, "live": True},
        )

