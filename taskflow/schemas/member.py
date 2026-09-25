"""Pydantic schemas for project membership and invitations."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from taskflow.models.member import InvitationStatus, ProjectRole


class MemberUser(BaseModel):
    """User summary for project member payload."""

    id: int
    email: str
    full_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectMemberRead(BaseModel):
    """Serialized member relationship."""

    id: int
    project_id: int
    user_id: int
    role: ProjectRole
    joined_at: datetime
    user: MemberUser | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectMemberInvite(BaseModel):
    """Payload to invite a collaborator to a project."""

    email: EmailStr
    role: ProjectRole = ProjectRole.MEMBER


class ProjectMemberUpdate(BaseModel):
    """Payload to change a member's role."""

    role: ProjectRole


class ProjectInvitationRead(BaseModel):
    """Serialized invitation."""

    id: int
    project_id: int
    inviter_id: int
    email: str
    role: ProjectRole
    status: InvitationStatus
    token: str
    created_at: datetime
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AcceptInvitationPayload(BaseModel):
    """Payload to accept an invitation token."""

    token: str = Field(..., min_length=10)
