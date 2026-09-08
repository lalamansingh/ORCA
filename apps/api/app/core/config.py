"""Environment-backed application settings."""

from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Values are loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = Field("ORCA Marine Intelligence API", validation_alias="APP_NAME")
    app_env: Literal["development", "test", "production", "demo"] = Field("development", validation_alias="APP_ENV")
    orca_version: str = Field("0.1.0-hackathon", validation_alias="ORCA_VERSION")
    debug: bool = Field(False, validation_alias="DEBUG")
    database_ssl: bool = Field(False, validation_alias="DATABASE_SSL")
    database_pool_size: int = Field(3, ge=1, le=10, validation_alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(2, ge=0, le=10, validation_alias="DATABASE_MAX_OVERFLOW")
    database_pool_timeout: int = Field(10, ge=1, le=30, validation_alias="DATABASE_POOL_TIMEOUT")
    api_v1_prefix: str = Field("/api/v1", validation_alias="API_V1_PREFIX")
    frontend_url: str = Field("http://localhost:3000", validation_alias="FRONTEND_URL")
    cors_origins: str = Field("http://localhost:3000", validation_alias="CORS_ORIGINS")
    log_level: str = Field("INFO", validation_alias="LOG_LEVEL")
    database_url: str = Field(
        "postgresql+asyncpg://orca:orca_local_dev_password@localhost:5432/orca",
        validation_alias="DATABASE_URL",
    )
    postgres_db: str = Field("orca", validation_alias="POSTGRES_DB")
    postgres_user: str = Field("orca", validation_alias="POSTGRES_USER")
    postgres_password: str = Field("orca_local_dev_password", validation_alias="POSTGRES_PASSWORD")
    postgres_host: str = Field("localhost", validation_alias="POSTGRES_HOST")
    postgres_port: int = Field(5432, validation_alias="POSTGRES_PORT")
    jwt_secret_key: str = Field("replace-with-a-long-random-secret", validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(15, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(14, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    cookie_secure: bool = Field(False, validation_alias="COOKIE_SECURE")
    cookie_samesite: Literal["lax", "strict", "none"] = Field("lax", validation_alias="COOKIE_SAMESITE")
    weather_provider: str = Field("open_meteo", validation_alias="WEATHER_PROVIDER")
    marine_provider: str = Field("open_meteo", validation_alias="MARINE_PROVIDER")
    open_meteo_weather_base_url: str = Field("https://api.open-meteo.com/v1/forecast", validation_alias="OPEN_METEO_WEATHER_BASE_URL")
    open_meteo_marine_base_url: str = Field("https://marine-api.open-meteo.com/v1/marine", validation_alias="OPEN_METEO_MARINE_BASE_URL")
    weather_request_timeout: float = Field(8.0, gt=0, validation_alias="WEATHER_REQUEST_TIMEOUT")
    marine_request_timeout: float = Field(10.0, gt=0, validation_alias="MARINE_REQUEST_TIMEOUT")
    provider_retry_count: int = Field(1, ge=0, le=3, validation_alias="PROVIDER_RETRY_COUNT")
    weather_cache_ttl: int = Field(600, ge=30, validation_alias="WEATHER_CACHE_TTL")
    marine_cache_ttl: int = Field(900, ge=30, validation_alias="MARINE_CACHE_TTL")
    alert_providers: str = Field("imd_cap,incois", validation_alias="ALERT_PROVIDERS")
    imd_cap_feed_url: str = Field("https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml", validation_alias="IMD_CAP_FEED_URL")
    imd_cap_base_url: str = Field("https://cap-sources.s3.amazonaws.com/in-imd-en/", validation_alias="IMD_CAP_BASE_URL")
    alert_request_timeout: float = Field(10.0, gt=0, validation_alias="ALERT_REQUEST_TIMEOUT")
    alert_cache_ttl: int = Field(900, ge=60, validation_alias="ALERT_CACHE_TTL")
    alert_max_feed_items: int = Field(20, ge=1, le=100, validation_alias="ALERT_MAX_FEED_ITEMS")
    alert_refresh_interval_minutes: int = Field(15, ge=5, le=1440, validation_alias="ALERT_REFRESH_INTERVAL_MINUTES")
    pfz_providers: str = Field("incois_wfs", validation_alias="PFZ_PROVIDERS")
    incois_pfz_wfs_url: str = Field("https://incois.gov.in/geoserver/PFZ_Automation/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=PFZ_Automation%3Apfzlines&outputFormat=application%2Fjson", validation_alias="INCOIS_PFZ_WFS_URL")
    pfz_request_timeout: float = Field(20.0, gt=0, validation_alias="PFZ_REQUEST_TIMEOUT")
    pfz_refresh_interval_minutes: int = Field(360, ge=15, le=1440, validation_alias="PFZ_REFRESH_INTERVAL_MINUTES")
    pfz_max_advisory_age_hours: int = Field(48, ge=1, le=336, validation_alias="PFZ_MAX_ADVISORY_AGE_HOURS")
    pfz_max_features: int = Field(500, ge=1, le=2000, validation_alias="PFZ_MAX_FEATURES")
    orca_demo_mode: bool = Field(False, validation_alias="ORCA_DEMO_MODE")
    llm_enabled: bool = Field(False, validation_alias="LLM_ENABLED")
    llm_provider: str = Field("openai", validation_alias="LLM_PROVIDER")
    openai_api_key: str = Field("", validation_alias="OPENAI_API_KEY")
    openai_model: str = Field("gpt-4o-mini", validation_alias="OPENAI_MODEL")
    gemini_api_key: str = Field("", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    llm_timeout_seconds: float = Field(20, gt=0, le=120, validation_alias="LLM_TIMEOUT_SECONDS")
    llm_max_retries: int = Field(1, ge=0, le=2, validation_alias="LLM_MAX_RETRIES")
    llm_temperature: float = Field(0, ge=0, le=1, validation_alias="LLM_TEMPERATURE")
    llm_max_input_chars: int = Field(4000, ge=100, le=16000, validation_alias="LLM_MAX_INPUT_CHARS")
    llm_max_output_tokens: int = Field(800, ge=64, le=4000, validation_alias="LLM_MAX_OUTPUT_TOKENS")
    ai_rate_limit_per_minute: int = Field(10, ge=1, le=120, validation_alias="AI_RATE_LIMIT_PER_MINUTE")
    orchestration_timeout_seconds: float = Field(45, gt=1, le=180, validation_alias="ORCHESTRATION_TIMEOUT_SECONDS")
    orchestration_max_parallel_steps: int = Field(3, ge=1, le=10, validation_alias="ORCHESTRATION_MAX_PARALLEL_STEPS")
    geofence_boundary_caution_km: float = Field(5, gt=0, le=100, validation_alias="GEOFENCE_BOUNDARY_CAUTION_KM")
    route_grid_size: int = Field(11, ge=3, le=49, validation_alias="ROUTE_GRID_SIZE")
    route_max_grid_cells: int = Field(2500, ge=9, le=10000, validation_alias="ROUTE_MAX_GRID_CELLS")
    route_timeout_seconds: float = Field(20, gt=1, le=120, validation_alias="ROUTE_TIMEOUT_SECONDS")
    pfz_ranking_enrich_top_n: int = Field(5, ge=1, le=10, validation_alias="PFZ_RANKING_ENRICH_TOP_N")
    pfz_ranking_timeout_seconds: float = Field(45, gt=1, le=120, validation_alias="PFZ_RANKING_TIMEOUT_SECONDS")
    auth_rate_limit_per_minute: int = Field(20, ge=1, le=300, validation_alias="AUTH_RATE_LIMIT_PER_MINUTE")
    expensive_rate_limit_per_minute: int = Field(10, ge=1, le=120, validation_alias="EXPENSIVE_RATE_LIMIT_PER_MINUTE")
    max_request_body_bytes: int = Field(1_000_000, ge=1024, le=10_000_000, validation_alias="MAX_REQUEST_BODY_BYTES")
    metrics_enabled: bool = Field(False, validation_alias="METRICS_ENABLED")
    orca_allow_demo_fallback: bool = Field(False, validation_alias="ORCA_ALLOW_DEMO_FALLBACK")

    @field_validator("debug", "orca_demo_mode", "llm_enabled", "metrics_enabled", "orca_allow_demo_fallback", mode="before")
    @classmethod
    def parse_debug_value(cls, value: object) -> bool:
        """Accept common deployment values while keeping DEBUG a boolean in-app."""
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "on", "debug"}

    @model_validator(mode="after")
    def secure_production_configuration(self):
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("SameSite=none requires Secure cookies")
        if self.app_env in {"production", "demo"}:
            if self.debug: raise ValueError("Hosted environments require DEBUG=false")
            if any(marker in self.jwt_secret_key.lower() for marker in ("replace-with", "local-compose", "test-only", "change-before")) or len(self.jwt_secret_key)<32:raise ValueError("Production requires a unique JWT_SECRET_KEY of at least 32 characters")
            if not self.cookie_secure:raise ValueError("Production requires COOKIE_SECURE=true")
            origins = [*self.cors_origin_list, self.frontend_url]
            if not self.cors_origin_list or any(urlsplit(origin).scheme != "https" or not urlsplit(origin).hostname or urlsplit(origin).hostname in {"localhost", "127.0.0.1"} or urlsplit(origin).path not in {"", "/"} or urlsplit(origin).query or urlsplit(origin).fragment or urlsplit(origin).username or "*" in origin for origin in origins):
                raise ValueError("Hosted environments require exact HTTPS frontend/CORS origins")
            if "orca_local_dev_password" in self.database_url or not urlsplit(self.database_url).password:
                raise ValueError("Hosted environments require an explicit database credential")
            if self.llm_enabled and (self.llm_provider != "openai" or not self.openai_api_key):
                raise ValueError("Hosted LLM requires configured provider credentials")
            if self.app_env == "production" and (self.orca_demo_mode or self.orca_allow_demo_fallback):
                raise ValueError("Use APP_ENV=demo for fixtures; production does not seed or fall back")
        return self

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix): return value.replace(prefix, "postgresql+asyncpg://", 1)
        if not value.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must use PostgreSQL")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        """Return normalized, non-empty CORS origins from a comma-separated setting."""
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def alert_provider_list(self) -> list[str]:
        return [provider.strip().lower() for provider in self.alert_providers.split(",") if provider.strip()]

    @property
    def pfz_provider_list(self) -> list[str]:
        return [provider.strip().lower() for provider in self.pfz_providers.split(",") if provider.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
