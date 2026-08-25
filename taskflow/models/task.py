"""Task ORM model.

Tasks belong to a project and carry status, priority, and due-date info.
"""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class TaskStatus(str, enum.Enum):
    """Lifecycle states a task can be in."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    """Relative urgency of a task."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    """A unit of work within a project.

    Attributes:
        id: Primary key.
        title: Short summary of the task.
        description: Optional detailed notes.
        status: Current lifecycle state.
        priority: Relative urgency.
        due_date: Optional deadline.
        completed_at: When the task moved to DONE (None otherwise).
        project_id: Foreign key to the parent project.
        assignee_id: Foreign key to the user responsible (defaults to owner).
        created_at / updated_at: Audit timestamps.
    """

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )
    due_date: Mapped[date | None] = mapped_column(Date)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
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
    project: Mapped["Project"] = relationship(back_populates="tasks")  # noqa: F821

    def mark_done(self) -> None:
        """Transition the task to DONE and stamp completion time."""
        self.status = TaskStatus.DONE
        self.completed_at = datetime.now()

    def reopen(self) -> None:
        """Return a completed task to TODO."""
        self.status = TaskStatus.TODO
        self.completed_at = None

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} status={self.status}>"
