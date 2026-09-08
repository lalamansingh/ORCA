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
from app.db.base import Base
import app.db.models  # noqa: F401

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


import sqlalchemy as sa

AUTH_DDL_STATEMENTS = [
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    """
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(320) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(512),
        preferred_language VARCHAR(16) DEFAULT 'en' NOT NULL,
        preferred_units VARCHAR(16) DEFAULT 'metric' NOT NULL,
        default_latitude FLOAT,
        default_longitude FLOAT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS refresh_token_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        jti VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        user_agent VARCHAR(512),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        language VARCHAR(16) DEFAULT 'en' NOT NULL,
        context_summary TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS saved_locations (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        location_type VARCHAR(32) DEFAULT 'CUSTOM' NOT NULL,
        is_favourite BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    "DO $$ BEGIN CREATE TYPE subscription_alert_type AS ENUM ('CYCLONE', 'STORM_SURGE', 'HIGH_WAVES', 'SWELL_SURGE', 'STRONG_WIND', 'LIGHTNING', 'HEAVY_RAIN', 'LOW_VISIBILITY', 'TSUNAMI', 'MARINE_HEAT_WAVE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
    "DO $$ BEGIN CREATE TYPE subscription_alert_severity AS ENUM ('INFO', 'WATCH', 'WARNING', 'SEVERE', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
    """
    CREATE TABLE IF NOT EXISTS alert_subscriptions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        saved_location_id UUID REFERENCES saved_locations(id) ON DELETE SET NULL,
        alert_type subscription_alert_type NOT NULL,
        minimum_severity subscription_alert_severity NOT NULL,
        radius_km FLOAT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS ix_alert_subscriptions_user_id ON alert_subscriptions(user_id);",
    """
    INSERT INTO users (id, email, full_name, preferred_language, preferred_units, default_latitude, default_longitude, is_active, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'captain@orca.marine', 'ORCA Marine Captain', 'en', 'metric', 18.92, 72.83, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET is_active = true, email = 'captain@orca.marine';
    """
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 data-provider-service"})
    try:
        async with app.state.db_engine.begin() as conn:
            try:
                await conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                await conn.execute(sa.text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            except Exception as ext_err:
                logger.warning("PostGIS extension note: %s", ext_err)

            # 1. Execute explicit DDL for core authentication & preference tables
            for stmt in AUTH_DDL_STATEMENTS:
                try:
                    await conn.execute(sa.text(stmt.strip()))
                except Exception as ddl_err:
                    logger.warning("DDL execution note: %s", ddl_err)
            logger.info("Core authentication & preference tables verified/created via DDL.")

            # 2. Attempt full schema creation for any remaining models
            try:
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Full database schema verified.")
            except Exception as all_err:
                logger.warning("Remaining tables schema note: %s", all_err)
    except Exception as exc:
        logger.error("Database startup init notice: %s", exc)
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
    cors_origins = [origin for origin in app_settings.cors_origin_list if origin != "*"]
    cors_regex = r"^https?:\/\/([a-zA-Z0-9_-]+\.)*(vercel\.app|up\.railway\.app|localhost|127\.0\.0\.1)(:[0-9]+)?$"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins or ["http://localhost:3000"],
        allow_origin_regex=cors_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
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
