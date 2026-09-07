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
    orca_demo_mode: bool = Field(False, validation_alias="ORCA_DEMO_MODE")

    @field_validator("debug", "orca_demo_mode", mode="before")
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
