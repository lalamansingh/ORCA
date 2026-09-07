"""Environment-backed application settings."""

from functools import lru_cache

from pydantic import Field, field_validator
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
    app_env: str = Field("development", validation_alias="APP_ENV")
    debug: bool = Field(True, validation_alias="DEBUG")
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
    cookie_samesite: str = Field("lax", validation_alias="COOKIE_SAMESITE")
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
    openai_model: str = Field("gpt-5-mini", validation_alias="OPENAI_MODEL")
    llm_timeout_seconds: float = Field(20, gt=0, le=120, validation_alias="LLM_TIMEOUT_SECONDS")
    llm_max_retries: int = Field(1, ge=0, le=2, validation_alias="LLM_MAX_RETRIES")
    llm_temperature: float = Field(0, ge=0, le=1, validation_alias="LLM_TEMPERATURE")
    llm_max_input_chars: int = Field(4000, ge=100, le=16000, validation_alias="LLM_MAX_INPUT_CHARS")
    llm_max_output_tokens: int = Field(800, ge=64, le=4000, validation_alias="LLM_MAX_OUTPUT_TOKENS")
    ai_rate_limit_per_minute: int = Field(10, ge=1, le=120, validation_alias="AI_RATE_LIMIT_PER_MINUTE")
    orchestration_timeout_seconds: float = Field(45, gt=1, le=180, validation_alias="ORCHESTRATION_TIMEOUT_SECONDS")
    orchestration_max_parallel_steps: int = Field(3, ge=1, le=10, validation_alias="ORCHESTRATION_MAX_PARALLEL_STEPS")
    geofence_boundary_caution_km: float = Field(5, gt=0, le=100, validation_alias="GEOFENCE_BOUNDARY_CAUTION_KM")

    @field_validator("debug", "orca_demo_mode", "llm_enabled", mode="before")
    @classmethod
    def parse_debug_value(cls, value: object) -> bool:
        """Accept common deployment values while keeping DEBUG a boolean in-app."""
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "on", "debug"}

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
