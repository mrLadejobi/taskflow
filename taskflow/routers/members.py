"""Router for project collaboration, members, and invitations."""
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from taskflow.activity import log_activity
from taskflow.dependencies import (
    CurrentUser,
    DbSession,
    get_project_accessible_or_404,
    get_project_admin_or_404,
)
from taskflow.models.member import (
    InvitationStatus,
    ProjectInvitation,
    ProjectMember,
    ProjectRole,
)
from taskflow.models.notification import Notification, NotificationType
from taskflow.models.user import User
from taskflow.schemas.member import (
    AcceptInvitationPayload,
    ProjectInvitationRead,
    ProjectMemberInvite,
    ProjectMemberRead,
    ProjectMemberUpdate,
)

router = APIRouter(tags=["members"])


@router.get(
    "/projects/{project_id}/members",
    response_model=list[ProjectMemberRead],
    summary="List project members",
)
def list_project_members(
    project_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[ProjectMember]:
    """Retrieve all users collaborating on a project."""
    get_project_accessible_or_404(db, project_id, current_user)

    stmt = (
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .options(selectinload(ProjectMember.user))
        .order_by(ProjectMember.joined_at.asc())
    )
    return list(db.scalars(stmt).all())


@router.post(
    "/projects/{project_id}/members",
    response_model=ProjectMemberRead,
    status_code=status.HTTP_201_CREATED,
    summary="Invite or add a member to a project",
)
def add_project_member(
    project_id: int,
    payload: ProjectMemberInvite,
    current_user: CurrentUser,
    db: DbSession,
) -> ProjectMember:
    """Add an existing user directly to a project (admin only)."""
    project = get_project_admin_or_404(db, project_id, current_user)

    target_user = db.scalar(select(User).where(User.email == payload.email))
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{payload.email}' not found. Please have them register first.",
        )

    if target_user.id == project.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already the owner of this project",
        )

    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == target_user.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this project",
        )

    member = ProjectMember(
        project_id=project_id,
        user_id=target_user.id,
        role=payload.role,
    )
    db.add(member)
    db.flush()

    log_activity(
        db,
        project_id=project_id,
        user_id=current_user.id,
        action="member_added",
        details={"user_id": target_user.id, "email": target_user.email, "role": payload.role},
    )

    # Deliver notification
    db.add(
        Notification(
            user_id=target_user.id,
            title=f"Added to project '{project.name}'",
            message=f"{current_user.full_name or current_user.email} added you as {payload.role.value}",
            type=NotificationType.PROJECT_INVITE,
            link=f"/projects/{project.id}",
        )
    )

    db.commit()
    db.refresh(member)
    return member


@router.patch(
    "/projects/{project_id}/members/{user_id}",
    response_model=ProjectMemberRead,
    summary="Update member role",
)
def update_member_role(
    project_id: int,
    user_id: int,
    payload: ProjectMemberUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> ProjectMember:
    """Modify the role of an existing project member (admin only)."""
    get_project_admin_or_404(db, project_id, current_user)

    member = db.scalar(
        select(ProjectMember)
        .where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .options(selectinload(ProjectMember.user))
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found"
        )

    member.role = payload.role
    db.commit()
    db.refresh(member)
    return member


@router.delete(
    "/projects/{project_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from a project",
)
def remove_project_member(
    project_id: int,
    user_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Remove a collaborator from a project (admin only or self-removal)."""
    # Allow self-removal or admin removal
    if current_user.id != user_id:
        get_project_admin_or_404(db, project_id, current_user)
    else:
        get_project_accessible_or_404(db, project_id, current_user)

    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found"
        )

    db.delete(member)
    db.commit()


@router.post(
    "/projects/{project_id}/invitations",
    response_model=ProjectInvitationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an invitation token",
)
def create_project_invitation(
    project_id: int,
    payload: ProjectMemberInvite,
    current_user: CurrentUser,
    db: DbSession,
) -> ProjectInvitation:
    """Generate an invite token that can be claimed via link."""
    project = get_project_admin_or_404(db, project_id, current_user)

    token = secrets.token_urlsafe(32)
    invitation = ProjectInvitation(
        project_id=project.id,
        inviter_id=current_user.id,
        email=payload.email,
        role=payload.role,
        status=InvitationStatus.PENDING,
        token=token,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post(
    "/invitations/accept",
    response_model=ProjectMemberRead,
    summary="Accept an invitation token",
)
def accept_invitation(
    payload: AcceptInvitationPayload,
    current_user: CurrentUser,
    db: DbSession,
) -> ProjectMember:
    """Claim an invitation and join the project."""
    invitation = db.scalar(
        select(ProjectInvitation).where(
            ProjectInvitation.token == payload.token,
            ProjectInvitation.status == InvitationStatus.PENDING,
        )
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired invitation"
        )

    if invitation.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
        invitation.status = InvitationStatus.REVOKED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired"
        )

    # Check if already member
    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == invitation.project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    if existing:
        invitation.status = InvitationStatus.ACCEPTED
        db.commit()
        return existing

    member = ProjectMember(
        project_id=invitation.project_id,
        user_id=current_user.id,
        role=invitation.role,
    )
    db.add(member)
    invitation.status = InvitationStatus.ACCEPTED

    log_activity(
        db,
        project_id=invitation.project_id,
        user_id=current_user.id,
        action="invitation_accepted",
        details={"email": invitation.email, "role": invitation.role},
    )

    db.commit()
    db.refresh(member)
    return member
