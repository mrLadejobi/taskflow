"""Pydantic schemas for notifications and user preferences."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from taskflow.models.notification import NotificationType


class NotificationRead(BaseModel):
    """Serialized in-app alert."""

    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    link: str | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCount(BaseModel):
    """Unread notification count badge payload."""

    unread_count: int


class UserSettingsRead(BaseModel):
    """Serialized user preference configuration."""

    id: int
    user_id: int
    email_notifications: bool
    task_assigned_alerts: bool
    status_change_alerts: bool
    theme: str
    compact_view: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """Payload to update user settings."""

    email_notifications: bool | None = None
    task_assigned_alerts: bool | None = None
    status_change_alerts: bool | None = None
    theme: str | None = Field(default=None, pattern="^(system|light|dark)$")
    compact_view: bool | None = None
