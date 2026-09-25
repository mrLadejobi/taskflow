"""Pydantic schemas for subtasks / checklist items."""
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class SubtaskCreate(BaseModel):
    """Payload to create a new subtask."""

    title: str = Field(..., min_length=1, max_length=255)
    position: int = Field(default=0, ge=0)
    due_date: date | None = None


class SubtaskUpdate(BaseModel):
    """Payload to update an existing subtask."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    position: int | None = Field(default=None, ge=0)
    due_date: date | None = None


class SubtaskReorder(BaseModel):
    """Payload to reorder subtasks in batch."""

    subtask_ids: list[int] = Field(..., min_length=1)


class SubtaskRead(BaseModel):
    """Serialized subtask response."""

    id: int
    task_id: int
    title: str
    is_completed: bool
    position: int
    due_date: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
