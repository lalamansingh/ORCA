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
from fastapi.responses import JSONResponse,PlainTextResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import router as api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging, request_id_context
from app.db.session import create_database_engine, create_session_factory
from app.schemas.common import APIError, ErrorEnvelope
from app.schemas.health import APIInfoResponse
from app.risk.config import DEFAULT_RISK_CONFIG
from app.risk.engine import MarineRiskEngine
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry
from app.services.rate_limiter import RateLimiter
from app.services.metrics import Metrics

logger = logging.getLogger(__name__)
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 data-provider-service"})
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
        version=app_settings.orca_version,
        debug=app_settings.debug,
        lifespan=lifespan,
    )
    app.state.settings = app_settings
    app.state.db_engine = create_database_engine(app_settings.database_url, app_settings)
    app.state.db_session_factory = create_session_factory(app.state.db_engine)
    app.state.forecast_cache = TTLCache()
    app.state.provider_status = ProviderStatusRegistry()
    app.state.risk_config = DEFAULT_RISK_CONFIG
    app.state.risk_engine = MarineRiskEngine(DEFAULT_RISK_CONFIG)
    app.state.rate_limiter = RateLimiter()
    app.state.metrics = Metrics()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID", "X-CSRF-Token"],
        expose_headers=["X-Request-ID"],
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
            content_length=request.headers.get("content-length")
            if content_length and content_length.isdigit() and int(content_length)>app_settings.max_request_body_bytes:
                return _error_response(request,status_code=413,code="REQUEST_TOO_LARGE",message="Request body is too large.")
            path=request.url.path;client=request.client.host if request.client else "unknown"
            limit=app_settings.auth_rate_limit_per_minute if path.endswith(("/login","/register","/refresh")) else app_settings.expensive_rate_limit_per_minute if path.endswith(("/ai/execute","/ai/conversations/messages","/routes/calculate","/pfz/recommendations")) else None
            if limit and not app.state.rate_limiter.allow(f"{client}:{path}",limit):return _error_response(request,status_code=429,code="RATE_LIMITED",message="Too many requests. Try again shortly.")
            response = await call_next(request)
            app.state.metrics.increment("orca_http_requests_total",f"{request.method}:{getattr(request.scope.get('route'), 'path', 'unmatched')}:{response.status_code}")
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
            details=[{key: value for key, value in error.items() if key in {"type", "loc", "msg"}} for error in exc.errors()],
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception type=%s", type(exc).__name__)
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

    @app.get("/metrics",include_in_schema=False)
    async def metrics():
        if not app_settings.metrics_enabled:return PlainTextResponse("metrics disabled\n",status_code=404)
        return PlainTextResponse(app.state.metrics.prometheus(),media_type="text/plain; version=0.0.4")

    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()
