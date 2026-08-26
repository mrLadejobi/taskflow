"""Task CRUD endpoints within projects, plus cross-project and bulk views."""
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import selectinload

from taskflow.dependencies import (
    CurrentUser,
    DbSession,
    PaginationParams,
    get_project_owned_or_404,
)
from taskflow.models.project import Project
from taskflow.models.tag import Tag
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.queries import apply_sort
from taskflow.schemas.common import Page
from taskflow.schemas.tags import TagCreate
from taskflow.schemas.task import (
    BulkDelete,
    BulkResult,
    BulkStatusUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
)

router = APIRouter(tags=["tasks"])

_TASK_SORTS = {
    "created_at": Task.created_at,
    "updated_at": Task.updated_at,
    "due_date": Task.due_date,
    "title": Task.title,
}

_SORT_DESCRIPTION = (
    "Sort field; prefix with '-' for descending. "
    "Allowed: created_at, updated_at, due_date, title."
)


@dataclass
class TaskFilters:
    """Bundle of generic task filters shared across listing endpoints."""

    status: TaskStatus | None
    priority: TaskPriority | None
    overdue: bool
    due_before: date | None
    due_after: date | None
    q: str | None
    tag: str | None


def task_filter_params(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = None,
    overdue: bool = Query(
        default=False, description="Only tasks past their due date and not done."
    ),
    due_before: date | None = Query(default=None, description="due_date <= this date."),
    due_after: date | None = Query(default=None, description="due_date >= this date."),
    q: str | None = Query(default=None, description="Text search in title/description."),
    tag: str | None = Query(default=None, description="Filter by tag name."),
) -> TaskFilters:
    """Dependency collecting the shared task filter query parameters."""
    return TaskFilters(
        status=status_filter,
        priority=priority,
        overdue=overdue,
        due_before=due_before,
        due_after=due_after,
        q=q,
        tag=tag,
    )


TaskFilterParams = Annotated[TaskFilters, Depends(task_filter_params)]


def apply_task_filters(base: Select, f: TaskFilters) -> Select:
    """Apply the shared task filters to a base ``select(Task)`` statement."""
    if f.status:
        base = base.where(Task.status == f.status)
    if f.priority:
        base = base.where(Task.priority == f.priority)
    if f.overdue:
        base = base.where(
            Task.due_date.is_not(None),
            Task.due_date < date.today(),
            Task.status != TaskStatus.DONE,
        )
    if f.due_before is not None:
        base = base.where(Task.due_date <= f.due_before)
    if f.due_after is not None:
        base = base.where(Task.due_date >= f.due_after)
    if f.q:
        like = f"%{f.q}%"
        base = base.where(or_(Task.title.ilike(like), Task.description.ilike(like)))
    if f.tag:
        base = base.where(Task.tags.any(Tag.name == f.tag))
    return base


def _paginate_tasks(
    db: DbSession, base: Select, pagination: PaginationParams, sort: str | None
) -> Page[TaskRead]:
    """Count, sort, page, and eager-load tags for a task query."""
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = apply_sort(base, sort, _TASK_SORTS, default="created_at")
    stmt = (
        stmt.options(selectinload(Task.tags))
        .limit(pagination.limit)
        .offset(pagination.offset)
    )
    items = list(db.scalars(stmt))
    return Page[TaskRead](
        items=items, total=total, limit=pagination.limit, offset=pagination.offset
    )


@router.get("/projects/{project_id}/tasks", response_model=Page[TaskRead])
def list_tasks(
    project_id: int,
    owner: CurrentUser,
    db: DbSession,
    pagination: PaginationParams,
    filters: TaskFilterParams,
    assignee_id: int | None = None,
    sort: str | None = Query(default=None, description=_SORT_DESCRIPTION),
) -> Page[TaskRead]:
    """List tasks in a project with filtering, sorting, and pagination."""
    get_project_owned_or_404(db, project_id, owner)
    base = select(Task).where(Task.project_id == project_id)
    if assignee_id is not None:
        base = base.where(Task.assignee_id == assignee_id)
    base = apply_task_filters(base, filters)
    return _paginate_tasks(db, base, pagination, sort)


@router.get("/users/me/tasks", response_model=Page[TaskRead])
def list_my_tasks(
    owner: CurrentUser,
    db: DbSession,
    pagination: PaginationParams,
    filters: TaskFilterParams,
    sort: str | None = Query(default=None, description=_SORT_DESCRIPTION),
) -> Page[TaskRead]:
    """List tasks assigned to the authenticated user across all projects."""
    base = select(Task).where(Task.assignee_id == owner.id)
    base = apply_task_filters(base, filters)
    return _paginate_tasks(db, base, pagination, sort)


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


@router.patch("/tasks/bulk", response_model=BulkResult)
def bulk_update_status(
    payload: BulkStatusUpdate, owner: CurrentUser, db: DbSession
) -> BulkResult:
    """Set the status on many of the caller's tasks at once.

    Tasks not owned by the caller (or not found) are silently ignored; the
    response reports how many of the requested ids were actually affected.
    """
    tasks = _owned_tasks(db, payload.task_ids, owner)
    for task in tasks:
        task.status = payload.status
        if payload.status == TaskStatus.DONE:
            if task.completed_at is None:
                task.completed_at = datetime.now(UTC)
        else:
            task.completed_at = None
    db.commit()
    return BulkResult(requested=len(payload.task_ids), affected=len(tasks))


@router.post("/tasks/bulk-delete", response_model=BulkResult)
def bulk_delete_tasks(
    payload: BulkDelete, owner: CurrentUser, db: DbSession
) -> BulkResult:
    """Delete many of the caller's tasks at once (unowned ids are ignored)."""
    tasks = _owned_tasks(db, payload.task_ids, owner)
    for task in tasks:
        db.delete(task)
    db.commit()
    return BulkResult(requested=len(payload.task_ids), affected=len(tasks))


@router.get("/tasks/{task_id}", response_model=TaskRead)
def read_task(task_id: int, owner: CurrentUser, db: DbSession) -> Task:
    """Fetch a single task the authenticated user owns (via its project)."""
    return _get_task_for_owner(db, task_id, owner)


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
    elif new_status is not None and new_status != TaskStatus.DONE:
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/complete", response_model=TaskRead)
def complete_task(task_id: int, owner: CurrentUser, db: DbSession) -> Task:
    """Mark a task as done."""
    task = _get_task_for_owner(db, task_id, owner)
    task.mark_done()
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


@router.post("/tasks/{task_id}/tags", response_model=TaskRead, status_code=201)
def add_tag_to_task(
    task_id: int, payload: TagCreate, owner: CurrentUser, db: DbSession
) -> Task:
    """Attach a tag to a task, creating the tag if it doesn't exist yet."""
    task = _get_task_for_owner(db, task_id, owner)
    tag = db.scalar(select(Tag).where(Tag.name == payload.name))
    if tag is None:
        tag = Tag(name=payload.name)
        db.add(tag)
        db.flush()
    if tag not in task.tags:
        task.tags.append(tag)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}/tags/{tag_id}", response_model=TaskRead)
def remove_tag_from_task(
    task_id: int, tag_id: int, owner: CurrentUser, db: DbSession
) -> Task:
    """Detach a tag from a task (the tag itself is not deleted)."""
    task = _get_task_for_owner(db, task_id, owner)
    tag = db.get(Tag, tag_id)
    if tag is None or tag not in task.tags:
        raise HTTPException(status_code=404, detail="Tag not attached to this task")
    task.tags.remove(tag)
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


def _owned_tasks(db: DbSession, task_ids: list[int], owner: CurrentUser) -> list[Task]:
    """Return the subset of the given task ids whose project the owner owns."""
    if not task_ids:
        return []
    stmt = (
        select(Task)
        .join(Project)
        .where(Task.id.in_(task_ids), Project.owner_id == owner.id)
    )
    return list(db.scalars(stmt))
