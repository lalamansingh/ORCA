from abc import ABC, abstractmethod

from app.domain.ocean_products import OceanProduct
from app.schemas.ocean_products import OceanProductMetadata, OceanSample


class OceanProductProvider(ABC):
    name: str

    @abstractmethod
    async def metadata(self, product: OceanProduct) -> OceanProductMetadata: ...

    @abstractmethod
    async def sample(self, product: OceanProduct, latitude: float, longitude: float) -> OceanSample: ...
