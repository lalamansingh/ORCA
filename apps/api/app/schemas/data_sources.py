from datetime import datetime

from pydantic import BaseModel


class DataSourceStatus(BaseModel):
    provider: str
    status: str
    last_success: datetime | None = None
    last_failure: datetime | None = None
    error_code: str | None = None


class DataSourcesResponse(BaseModel):
    weather: DataSourceStatus
    marine: DataSourceStatus
