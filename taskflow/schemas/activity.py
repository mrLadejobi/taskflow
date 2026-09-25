"""Pydantic schemas for activity logging."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ActivityUser(BaseModel):
    """User summary for activity events."""

    id: int
    email: str
    full_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ActivityRead(BaseModel):
    """Serialized audit log entry."""

    id: int
    project_id: int
    task_id: int | None = None
    user_id: int
    action: str
    details: str | None = None
    created_at: datetime
    user: ActivityUser | None = None

    model_config = ConfigDict(from_attributes=True)
