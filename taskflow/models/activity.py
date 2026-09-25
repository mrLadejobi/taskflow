"""ActivityLog ORM model.

Maintains a timeline and audit trail of actions taken across projects and tasks.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class ActivityLog(Base):
    """An event recorded in a project's or task's activity stream.

    Attributes:
        id: Primary key.
        project_id: Foreign key to the related project.
        task_id: Optional foreign key to a specific task.
        user_id: Foreign key to the user who performed the action.
        action: Identifier for the event type (e.g. status_changed, comment_added).
        details: Optional JSON/text description of state differences or notes.
        created_at: Event timestamp.
    """

    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="activities")  # noqa: F821
    task: Mapped["Task | None"] = relationship(back_populates="activities")  # noqa: F821
    user: Mapped["User"] = relationship()  # noqa: F821

    def __repr__(self) -> str:
        return f"<ActivityLog id={self.id} action={self.action!r} project_id={self.project_id}>"
