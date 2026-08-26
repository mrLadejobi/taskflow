from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

# ── Association table (define FIRST) ──────────────────────────
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(50), unique=True, nullable=False)

    tasks = relationship("Task", secondary="task_tags", back_populates="tags")


class Task(Base):
    __tablename__ = "tasks"

    id = mapped_column(Integer, primary_key=True)
    title = mapped_column(String(200), nullable=False)
    # ... keep ALL your existing columns here (description, status,
    #     due_date, project_id, created_at, etc.) — don't delete them!

    project = relationship("Project", back_populates="tasks")
    tags = relationship("Tag", secondary="task_tags", back_populates="tasks")
