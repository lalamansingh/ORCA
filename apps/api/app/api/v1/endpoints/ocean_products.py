from fastapi import APIRouter, Query, Request

from app.domain.ocean_products import OceanProduct
from app.providers.ocean_products.demo import DemoOceanProductProvider
from app.schemas.ocean_products import OceanProductMetadata, OceanProductsResponse, OceanSampleResponse
from app.services.ocean_product_service import OceanProductService

router = APIRouter(prefix="/ocean-products")


def service(request: Request) -> OceanProductService:
    # INCOIS ERDDAP datasets were inspected but the publicly indexed SST and
    # chlorophyll datasets end in 2011 and 2006 respectively, so they are not
    # represented as current observations. This fixture stays explicit.
    return OceanProductService(DemoOceanProductProvider(), request.app.state.forecast_cache, 900)


@router.get("", response_model=OceanProductsResponse)
async def products(request: Request) -> OceanProductsResponse: return await service(request).products()


@router.get("/sst", response_model=OceanProductMetadata)
async def sst(request: Request) -> OceanProductMetadata: return await service(request).metadata(OceanProduct.SEA_SURFACE_TEMPERATURE)


@router.get("/chlorophyll", response_model=OceanProductMetadata)
async def chlorophyll(request: Request) -> OceanProductMetadata: return await service(request).metadata(OceanProduct.CHLOROPHYLL_A)


@router.get("/sample", response_model=OceanSampleResponse)
async def sample(request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180), products: str = "sst,chlorophyll") -> OceanSampleResponse:
    names = {part.strip().lower() for part in products.split(",")}
    selected = [product for product in OceanProduct if (product == OceanProduct.SEA_SURFACE_TEMPERATURE and "sst" in names) or (product == OceanProduct.CHLOROPHYLL_A and "chlorophyll" in names)]
    return await service(request).sample(latitude, longitude, selected)


@router.get("/{product}/times")
async def times(product: OceanProduct, request: Request) -> dict[str, object]: return await service(request).times(product)
