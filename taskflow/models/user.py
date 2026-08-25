"""User ORM model.

Represents a registered TaskFlow account. Passwords are stored as
bcrypt hashes — never in plaintext.
"""
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class User(Base):
    """A registered application user.

    Attributes:
        id: Primary key.
        email: Unique login identifier.
        hashed_password: bcrypt hash of the account password.
        full_name: Optional display name.
        is_active: Soft-disable flag for deactivated accounts.
        created_at: Timestamp of account creation (server-generated).
        projects: Projects owned by this user.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
