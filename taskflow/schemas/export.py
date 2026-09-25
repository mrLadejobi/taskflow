"""Pydantic schemas for data export and CSV import."""
from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class TaskExportRow(BaseModel):
    """Normalized schema for exported tasks."""

    id: int
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: str | None = None
    assignee_email: str | None = None
    tags: str | None = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class TaskImportItem(BaseModel):
    """Schema for individual row imported via CSV or JSON."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"
    due_date: date | None = None
    tags: list[str] = Field(default_factory=list)


class ImportSummary(BaseModel):
    """Result summary of an import operation."""

    imported: int
    skipped: int
    errors: list[str] = Field(default_factory=list)
