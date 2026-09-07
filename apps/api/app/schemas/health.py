"""Health and service information schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    dependencies: "DependenciesResponse"


class DatabaseDependencyResponse(BaseModel):
    status: str
    postgis: bool | None


class DependenciesResponse(BaseModel):
    database: DatabaseDependencyResponse
    weather_provider: "ProviderDependencyResponse"
    marine_provider: "ProviderDependencyResponse"


class ProviderDependencyResponse(BaseModel):
    status: str
    last_success: str | None = None


class APIInfoResponse(BaseModel):
    name: str
    status: str
    docs: str
