"""Shared FastAPI dependencies.

Provides database sessions and authenticated-user resolution for routes.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from taskflow.database import get_db
from taskflow.models.user import User
from taskflow.security import decode_access_token

# tokenUrl points at our login route; Swagger UI uses it automatically.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    """Resolve the authenticated user from a bearer JWT.

    Raises:
        HTTPException: 401 if the token is invalid or the user no longer exists.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise credentials_error

    try:
        user_id = int(user_id_raw)
    except ValueError:
        raise credentials_error from None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_user_or_404(db: DbSession, user_id: int) -> User:
    """Fetch a user by id or raise 404."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_project_owned_or_404(db: DbSession, project_id: int, owner: User):
    """Fetch a project by id, ensuring it belongs to the given owner."""
    from taskflow.models.project import Project

    stmt = select(Project).where(Project.id == project_id, Project.owner_id == owner.id)
    project = db.scalars(stmt).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
