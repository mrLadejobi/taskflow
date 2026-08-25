"""Pydantic schemas for user resources."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Fields shared across user schemas."""

    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    """Payload required to register a new user."""

    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Fields that may be updated on an existing user."""

    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None


class UserRead(UserBase):
    """User representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
