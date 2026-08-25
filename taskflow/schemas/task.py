"""Pydantic schemas for task resources."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from taskflow.models.task import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    """Shared fields across task schemas."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: date | None = None


class TaskCreate(TaskBase):
    """Payload required to create a task within a project."""

    assignee_id: int | None = None


class TaskUpdate(BaseModel):
    """Fields that may be patched on an existing task."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    assignee_id: int | None = None


class TaskRead(TaskBase):
    """Task representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TaskStatus
    project_id: int
    assignee_id: int | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
