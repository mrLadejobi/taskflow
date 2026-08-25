"""Task CRUD endpoints within projects."""
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from taskflow.dependencies import CurrentUser, DbSession, get_project_owned_or_404
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(tags=["tasks"])


@router.get("/projects/{project_id}/tasks", response_model=list[TaskRead])
def list_tasks(
    project_id: int,
    owner: CurrentUser,
    db: DbSession,
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = None,
) -> list[Task]:
    """List tasks in a project, optionally filtered by status/priority."""
    get_project_owned_or_404(db, project_id, owner)
    stmt = select(Task).where(Task.project_id == project_id)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    if priority:
        stmt = stmt.where(Task.priority == priority)
    return list(db.scalars(stmt.order_by(Task.created_at)))


@router.post("/projects/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(project_id: int, payload: TaskCreate, owner: CurrentUser, db: DbSession) -> Task:
    """Create a new task in the given project."""
    project = get_project_owned_or_404(db, project_id, owner)
    assignee_id = payload.assignee_id or owner.id
    task = Task(
        **payload.model_dump(exclude={"assignee_id"}),
        project_id=project.id,
        assignee_id=assignee_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, owner: CurrentUser, db: DbSession) -> Task:
    """Partially update a task; auto-stamps completion time on DONE."""
    task = _get_task_for_owner(db, task_id, owner)
    data = payload.model_dump(exclude_unset=True)

    new_status = data.get("status")
    for field, value in data.items():
        setattr(task, field, value)

    if new_status == TaskStatus.DONE and task.completed_at is None:
        task.completed_at = datetime.now(UTC)
    elif new_status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS) and new_status is not None:
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/complete", response_model=TaskRead)
def complete_task(task_id: int, owner: CurrentUser, db: DbSession) -> Task:
    """Mark a task as done."""
    task = _get_task_for_owner(db, task_id, owner)
    task.mark_done()
    task.completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/reopen", response_model=TaskRead)
def reopen_task(task_id: int, owner: CurrentUser, db: DbSession) -> Task:
    """Reopen a completed task."""
    task = _get_task_for_owner(db, task_id, owner)
    task.reopen()
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, owner: CurrentUser, db: DbSession) -> None:
    """Delete a task."""
    task = _get_task_for_owner(db, task_id, owner)
    db.delete(task)
    db.commit()


def _get_task_for_owner(db: DbSession, task_id: int, owner: CurrentUser) -> Task:
    """Fetch a task whose parent project belongs to the owner."""
    task = db.scalars(select(Task).where(Task.id == task_id)).first()
    if task is None or task.project.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
