from datetime import UTC, datetime

from app.domain.ocean_products import OceanProduct
from app.providers.ocean_products.base import OceanProductProvider
from app.schemas.ocean_products import OceanProductMetadata, OceanProductsResponse, OceanSampleResponse
from app.schemas.evidence import Location
from app.services.forecast_cache import TTLCache


class OceanProductService:
    def __init__(self, provider: OceanProductProvider, cache: TTLCache, ttl: int) -> None:
        self.provider, self.cache, self.ttl = provider, cache, ttl

    async def metadata(self, product: OceanProduct) -> OceanProductMetadata:
        key = f"ocean:metadata:{product.value}"
        if cached := await self.cache.get(key): return cached
        item = await self.provider.metadata(product)
        await self.cache.set(key, item, self.ttl)
        return item

    async def products(self) -> OceanProductsResponse:
        return OceanProductsResponse(products=[await self.metadata(product) for product in OceanProduct])

    async def sample(self, latitude: float, longitude: float, products: list[OceanProduct]) -> OceanSampleResponse:
        samples = {"sst" if product == OceanProduct.SEA_SURFACE_TEMPERATURE else "chlorophyll": await self.provider.sample(product, latitude, longitude) for product in products}
        return OceanSampleResponse(location=Location(latitude=latitude, longitude=longitude), samples=samples)

    async def times(self, product: OceanProduct) -> dict[str, object]:
        item = await self.metadata(product)
        return {"product": product, "status": item.status, "latest_timestamp": item.valid_time, "available_timestamps": [item.valid_time] if item.valid_time else [], "provider": item.provider, "retrieved_at": datetime.now(UTC)}
