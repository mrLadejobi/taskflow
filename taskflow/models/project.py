"""Project ORM model.

A project is a container for tasks owned by a single user.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class Project(Base):
    """A user-owned collection of tasks.

    Attributes:
        id: Primary key.
        name: Display name of the project.
        description: Optional longer description.
        owner_id: Foreign key to the owning user.
        created_at: Server-generated creation timestamp.
        owner: The user who owns this project.
        tasks: Tasks belonging to this project.
    """

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="projects")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name!r}>"
