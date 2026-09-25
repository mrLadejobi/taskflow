"""Comment ORM model.

Supports task-level discussions with author attribution and optional threaded replies.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class Comment(Base):
    """A discussion comment or note attached to a task.

    Attributes:
        id: Primary key.
        task_id: Foreign key to the parent task.
        author_id: Foreign key to the commenting user.
        content: Text markdown content of the comment.
        parent_id: Optional ID of a parent comment for threaded conversations.
        created_at: Creation timestamp.
        updated_at: Last edit timestamp.
        task: Parent task reference.
        author: User who authored the comment.
        parent: Parent comment (if reply).
        replies: Child replies to this comment.
    """

    __tablename__ = "task_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("task_comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
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
    task: Mapped["Task"] = relationship(back_populates="comments")  # noqa: F821
    author: Mapped["User"] = relationship()  # noqa: F821
    parent: Mapped["Comment | None"] = relationship(
        remote_side=[id], back_populates="replies"
    )
    replies: Mapped[list["Comment"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Comment id={self.id} task_id={self.task_id} author_id={self.author_id}>"
