"""Router for subtasks and task checklists."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from taskflow.activity import log_activity
from taskflow.dependencies import CurrentUser, DbSession, get_task_accessible_or_404
from taskflow.models.subtask import Subtask
from taskflow.schemas.subtask import (
    SubtaskCreate,
    SubtaskRead,
    SubtaskReorder,
    SubtaskUpdate,
)

router = APIRouter(tags=["subtasks"])


@router.post(
    "/tasks/{task_id}/subtasks",
    response_model=SubtaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a subtask to a task",
)
def create_subtask(
    task_id: int,
    payload: SubtaskCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> Subtask:
    """Create a new checklist milestone or subtask."""
    task = get_task_accessible_or_404(db, task_id, current_user)

    # Calculate position if default
    if payload.position == 0:
        max_pos = db.scalar(
            select(func.coalesce(func.max(Subtask.position), -1)).where(
                Subtask.task_id == task_id
            )
        )
        calculated_position = (max_pos or 0) + 1
    else:
        calculated_position = payload.position

    subtask = Subtask(
        task_id=task_id,
        title=payload.title,
        position=calculated_position,
        due_date=payload.due_date,
    )
    db.add(subtask)
    db.flush()

    log_activity(
        db,
        project_id=task.project_id,
        user_id=current_user.id,
        action="subtask_created",
        task_id=task.id,
        details={"subtask_id": subtask.id, "title": subtask.title},
    )

    db.commit()
    db.refresh(subtask)
    return subtask


@router.get(
    "/tasks/{task_id}/subtasks",
    response_model=list[SubtaskRead],
    summary="List subtasks for a task",
)
def list_subtasks(
    task_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[Subtask]:
    """Retrieve all checklist items belonging to a task."""
    get_task_accessible_or_404(db, task_id, current_user)

    stmt = (
        select(Subtask)
        .where(Subtask.task_id == task_id)
        .order_by(Subtask.position.asc(), Subtask.created_at.asc())
    )
    return list(db.scalars(stmt).all())


@router.patch(
    "/subtasks/{subtask_id}",
    response_model=SubtaskRead,
    summary="Update a subtask",
)
def update_subtask(
    subtask_id: int,
    payload: SubtaskUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> Subtask:
    """Update title, completion flag, position, or due date of a subtask."""
    subtask = db.get(Subtask, subtask_id)
    if subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found"
        )

    task = get_task_accessible_or_404(db, subtask.task_id, current_user)

    was_completed = subtask.is_completed
    if payload.title is not None:
        subtask.title = payload.title
    if payload.is_completed is not None:
        subtask.is_completed = payload.is_completed
    if payload.position is not None:
        subtask.position = payload.position
    if payload.due_date is not None:
        subtask.due_date = payload.due_date

    # Log completion state toggle
    if payload.is_completed is not None and payload.is_completed != was_completed:
        log_activity(
            db,
            project_id=task.project_id,
            user_id=current_user.id,
            action="subtask_toggled",
            task_id=task.id,
            details={
                "subtask_id": subtask.id,
                "title": subtask.title,
                "is_completed": subtask.is_completed,
            },
        )

    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete(
    "/subtasks/{subtask_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a subtask",
)
def delete_subtask(
    subtask_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a subtask."""
    subtask = db.get(Subtask, subtask_id)
    if subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found"
        )

    get_task_accessible_or_404(db, subtask.task_id, current_user)
    db.delete(subtask)
    db.commit()


@router.post(
    "/tasks/{task_id}/subtasks/reorder",
    response_model=list[SubtaskRead],
    summary="Reorder subtasks in batch",
)
def reorder_subtasks(
    task_id: int,
    payload: SubtaskReorder,
    current_user: CurrentUser,
    db: DbSession,
) -> list[Subtask]:
    """Reorder a list of subtasks by updating positions sequentially."""
    get_task_accessible_or_404(db, task_id, current_user)

    stmt = select(Subtask).where(Subtask.task_id == task_id)
    subtasks = {s.id: s for s in db.scalars(stmt).all()}

    for index, s_id in enumerate(payload.subtask_ids):
        if s_id in subtasks:
            subtasks[s_id].position = index

    db.commit()

    updated = (
        select(Subtask)
        .where(Subtask.task_id == task_id)
        .order_by(Subtask.position.asc())
    )
    return list(db.scalars(updated).all())
