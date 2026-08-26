"""Tag ORM model and the task↔tag association table.

Tags are lightweight labels that can be attached to many tasks; a task may
carry many tags. The relationship is realized through the ``task_tags``
association table.
"""
from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base

# Association table linking tasks and tags (many-to-many). Defined before the
# Tag model so both sides can reference it by name.
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """A reusable label that can be applied to tasks.

    Attributes:
        id: Primary key.
        name: Unique, human-readable label.
        tasks: Tasks currently carrying this tag.
    """

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        secondary="task_tags", back_populates="tags"
    )

    def __repr__(self) -> str:
        return f"<Tag id={self.id} name={self.name!r}>"
