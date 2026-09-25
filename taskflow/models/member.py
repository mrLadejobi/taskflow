"""Project collaboration & membership models.

Implements workspace sharing, role-based access control, and team invitations.
"""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from taskflow.database import Base


class ProjectRole(str, enum.Enum):
    """Access control permission tiers for project members."""

    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class InvitationStatus(str, enum.Enum):
    """Lifecycle state of an email invitation."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"


class ProjectMember(Base):
    """Associates a user with a project under an assigned permission role.

    Attributes:
        id: Primary key.
        project_id: Foreign key to the project.
        user_id: Foreign key to the member user.
        role: Permission level (admin, member, viewer).
        joined_at: When the user joined the project.
    """

    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[ProjectRole] = mapped_column(
        Enum(ProjectRole), default=ProjectRole.MEMBER, nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="members")  # noqa: F821
    user: Mapped["User"] = relationship(back_populates="project_memberships")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ProjectMember id={self.id} project_id={self.project_id} role={self.role}>"


class ProjectInvitation(Base):
    """An invitation to collaborate on a project sent to an email address.

    Attributes:
        id: Primary key.
        project_id: Foreign key to the target project.
        inviter_id: Foreign key to the user who created the invitation.
        email: Recipient email address.
        role: Assigned role upon acceptance.
        status: Current status (pending, accepted, revoked).
        token: Unique verification token for accepting the invitation.
        created_at: Issuance timestamp.
        expires_at: Expiration timestamp.
    """

    __tablename__ = "project_invitations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    inviter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[ProjectRole] = mapped_column(
        Enum(ProjectRole), default=ProjectRole.MEMBER, nullable=False
    )
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="invitations")  # noqa: F821
    inviter: Mapped["User"] = relationship()  # noqa: F821

    def __repr__(self) -> str:
        return f"<ProjectInvitation email={self.email!r} project_id={self.project_id} status={self.status}>"
