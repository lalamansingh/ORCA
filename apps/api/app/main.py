"""FastAPI application factory for ORCA."""

import logging
import re
import time
from contextlib import asynccontextmanager
from uuid import uuid4

import httpx
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import router as api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging, request_id_context
from app.db.session import create_database_engine, create_session_factory
from app.schemas.common import APIError, ErrorEnvelope
from app.schemas.health import APIInfoResponse
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry

logger = logging.getLogger(__name__)
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 weather-service"})
    yield
    await app.state.http_client.aclose()
    await app.state.db_engine.dispose()


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def _error_response(
    request: Request, *, status_code: int, code: str, message: str, details: object | None = None
) -> JSONResponse:
    payload = ErrorEnvelope(
        error=APIError(code=code, message=message, details=details), request_id=_request_id(request)
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the ORCA API application with cross-cutting middleware and routes."""
    app_settings = settings or get_settings()
    configure_logging(app_settings.log_level)

    app = FastAPI(
        title=app_settings.app_name,
        description="Foundation API for ORCA marine intelligence services.",
        version="0.1.0",
        debug=app_settings.debug,
        lifespan=lifespan,
    )
    app.state.settings = app_settings
    app.state.db_engine = create_database_engine(app_settings.database_url)
    app.state.db_session_factory = create_session_factory(app.state.db_engine)
    app.state.forecast_cache = TTLCache()
    app.state.provider_status = ProviderStatusRegistry()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID", "X-CSRF-Token"],
    )

    @app.middleware("http")
    async def add_request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
        incoming_id = request.headers.get("X-Request-ID", "")
        request_id = incoming_id if REQUEST_ID_PATTERN.fullmatch(incoming_id) else str(uuid4())
        request.state.request_id = request_id
        token = request_id_context.set(request_id)
        started_at = time.perf_counter()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            status_code = response.status_code if response is not None else status.HTTP_500_INTERNAL_SERVER_ERROR
            logger.info(
                "http_request method=%s path=%s status=%s duration_ms=%s",
                request.method,
                request.url.path,
                status_code,
                duration_ms,
            )
            if response is not None:
                response.headers["X-Request-ID"] = request_id
            request_id_context.reset(token)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(request, status_code=exc.status_code, code="HTTP_ERROR", message=str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error_response(
            request,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Request validation failed.",
            details=exc.errors(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_exception")
        message = "An unexpected server error occurred."
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message=message,
        )

    @app.get("/", response_model=APIInfoResponse, tags=["system"])
    async def api_info() -> APIInfoResponse:
        return APIInfoResponse(name=app_settings.app_name, status="running", docs="/docs")

    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()
