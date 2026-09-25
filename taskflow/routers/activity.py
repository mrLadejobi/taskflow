"""Router for audit activity logs and event streams."""
from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from taskflow.dependencies import (
    CurrentUser,
    DbSession,
    PaginationParams,
    get_project_accessible_or_404,
    get_task_accessible_or_404,
)
from taskflow.models.activity import ActivityLog
from taskflow.schemas.activity import ActivityRead
from taskflow.schemas.common import Page

router = APIRouter(tags=["activity"])


@router.get(
    "/projects/{project_id}/activity",
    response_model=Page[ActivityRead],
    summary="Get project activity timeline",
)
def get_project_activity(
    project_id: int,
    pagination: PaginationParams,
    current_user: CurrentUser,
    db: DbSession,
) -> Page[ActivityRead]:
    """Retrieve chronologically ordered events for a project."""
    get_project_accessible_or_404(db, project_id, current_user)

    stmt = (
        select(ActivityLog)
        .where(ActivityLog.project_id == project_id)
        .options(selectinload(ActivityLog.user))
        .order_by(ActivityLog.created_at.desc())
    )

    total = len(list(db.scalars(stmt).all()))
    items = list(
        db.scalars(stmt.offset(pagination.offset).limit(pagination.limit)).all()
    )

    return Page[ActivityRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get(
    "/tasks/{task_id}/activity",
    response_model=list[ActivityRead],
    summary="Get task activity timeline",
)
def get_task_activity(
    task_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[ActivityRead]:
    """Retrieve chronologically ordered events for a specific task."""
    task = get_task_accessible_or_404(db, task_id, current_user)

    stmt = (
        select(ActivityLog)
        .where(ActivityLog.task_id == task.id)
        .options(selectinload(ActivityLog.user))
        .order_by(ActivityLog.created_at.desc())
    )
    return list(db.scalars(stmt).all())
