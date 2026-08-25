"""User management endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Annotated
from fastapi import APIRouter, Depends
from taskflow.dependencies import CurrentUser, DbSession, get_user_or_404
from taskflow.models.user import User
from taskflow.schemas.user import UserRead, UserUpdate
from taskflow.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: CurrentUser) -> User:
    """Return the currently authenticated user."""
    return current_user


@router.patch("/me", response_model=UserRead)
def update_me(payload: UserUpdate, current_user: CurrentUser, db: DbSession) -> User:
    """Update profile fields of the authenticated user."""
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        current_user.hashed_password = hash_password(data.pop("password"))
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserRead)
def read_user(user: Annotated[User, Depends(get_user_or_404)]) -> User:
    """Fetch any user's public profile by id."""
    return user

