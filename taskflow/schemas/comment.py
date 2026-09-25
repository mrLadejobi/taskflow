"""Pydantic schemas for task comments."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CommentAuthor(BaseModel):
    """Author summary for comment payloads."""

    id: int
    email: str
    full_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    """Payload to add a comment or reply to a task."""

    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: int | None = None


class CommentUpdate(BaseModel):
    """Payload to update an existing comment."""

    content: str = Field(..., min_length=1, max_length=5000)


class CommentRead(BaseModel):
    """Serialized comment response."""

    id: int
    task_id: int
    author_id: int
    content: str
    parent_id: int | None = None
    created_at: datetime
    updated_at: datetime
    author: CommentAuthor | None = None

    model_config = ConfigDict(from_attributes=True)
