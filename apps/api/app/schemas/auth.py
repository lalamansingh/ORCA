from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str: return str(value).strip().lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str: return str(value).strip().lower()

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    full_name: str | None
    preferred_language: str
    preferred_units: str
    default_latitude: float | None
    default_longitude: float | None
    is_active: bool
    created_at: datetime

class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    preferred_language: str | None = Field(default=None, pattern="^[a-z]{2,8}$")
    preferred_units: str | None = Field(default=None, pattern="^(metric|nautical)$")
    default_latitude: float | None = Field(default=None, ge=-90, le=90)
    default_longitude: float | None = Field(default=None, ge=-180, le=180)
    @model_validator(mode="after")
    def complete_location_pair(self) -> "UserProfileUpdate":
        if (self.default_latitude is None) != (self.default_longitude is None):
            raise ValueError("Default latitude and longitude must be provided together.")
        return self
