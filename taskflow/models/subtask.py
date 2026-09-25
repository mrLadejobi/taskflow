"""Subtask ORM model.

Supports breaking down tasks into smaller, actionable checklist items.
"""
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class Subtask(Base):
    """An individual checklist milestone or subtask belonging to a task.

    Attributes:
        id: Primary key.
        task_id: Foreign key to the parent task.
        title: Short description of the subtask.
        is_completed: Completion status flag.
        position: Ordering index within the task's checklist.
        due_date: Optional milestone deadline.
        created_at: Creation timestamp.
        updated_at: Modification timestamp.
        task: Parent task reference.
    """

    __tablename__ = "subtasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
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
    task: Mapped["Task"] = relationship(back_populates="subtasks")  # noqa: F821

    def toggle(self) -> bool:
        """Flip the completion status and return the new state."""
        self.is_completed = not self.is_completed
        return self.is_completed

    def __repr__(self) -> str:
        return f"<Subtask id={self.id} task_id={self.task_id} completed={self.is_completed}>"
