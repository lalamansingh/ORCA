"""Shared API response and input validation schemas."""

from typing import Any

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    """Geographic coordinates used by future marine intelligence APIs."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class APIError(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorEnvelope(BaseModel):
    error: APIError
    request_id: str
