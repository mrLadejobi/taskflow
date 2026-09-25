"""Notification & UserSettings ORM models.

Handles in-app alerts and customizable user delivery preferences.
"""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class NotificationType(str, enum.Enum):
    """Event taxonomy for generated user alerts."""

    TASK_ASSIGNED = "task_assigned"
    TASK_STATUS = "task_status"
    COMMENT_ADDED = "comment_added"
    PROJECT_INVITE = "project_invite"
    SYSTEM = "system"


class Notification(Base):
    """An alert delivered to a user.

    Attributes:
        id: Primary key.
        user_id: Foreign key to recipient user.
        title: Short title of the alert.
        message: Detailed alert body.
        type: Event category.
        link: Optional internal routing link (e.g. /projects/1).
        is_read: Read status flag.
        created_at: Issuance timestamp.
        user: Recipient user relationship.
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False
    )
    link: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")  # noqa: F821

    def mark_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} read={self.is_read}>"


class UserSettings(Base):
    """Individual preferences for user notifications and UI theme.

    Attributes:
        id: Primary key.
        user_id: Unique foreign key to the user.
        email_notifications: Whether email alerts are enabled.
        task_assigned_alerts: Notify when a task is assigned to user.
        status_change_alerts: Notify when watched task changes status.
        theme: UI preference ('system', 'light', 'dark').
        compact_view: Whether to display tables in compact mode.
    """

    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    task_assigned_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status_change_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    theme: Mapped[str] = mapped_column(String(20), default="system", nullable=False)
    compact_view: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="settings")  # noqa: F821

    def __repr__(self) -> str:
        return f"<UserSettings user_id={self.user_id} theme={self.theme}>"
