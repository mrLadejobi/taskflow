"""Pydantic schemas for project resources."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    """Shared fields across project schemas."""

    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class ProjectCreate(ProjectBase):
    """Payload required to create a new project."""


class ProjectUpdate(BaseModel):
    """Fields that may be updated on an existing project."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None


class ProjectRead(ProjectBase):
    """Project representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime


class ProjectWithStats(ProjectRead):
    """Project plus aggregated task statistics."""

    total_tasks: int = 0
    completed_tasks: int = 0
