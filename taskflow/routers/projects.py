"""Project CRUD endpoints, scoped to the authenticated owner."""
from fastapi import APIRouter, Query
from sqlalchemy import func, select

from taskflow.dependencies import (
    CurrentUser,
    DbSession,
    PaginationParams,
    get_project_owned_or_404,
)
from taskflow.models.project import Project
from taskflow.models.task import Task, TaskStatus
from taskflow.queries import apply_sort
from taskflow.schemas.common import Page
from taskflow.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    ProjectWithStats,
)

router = APIRouter(prefix="/projects", tags=["projects"])

_PROJECT_SORTS = {"created_at": Project.created_at, "name": Project.name}


@router.get("", response_model=Page[ProjectRead])
def list_projects(
    owner: CurrentUser,
    db: DbSession,
    pagination: PaginationParams,
    sort: str | None = Query(
        default=None,
        description="Sort field; prefix with '-' for descending. "
        "Allowed: created_at, name.",
    ),
) -> Page[ProjectRead]:
    """List projects belonging to the authenticated user (paginated)."""
    base = select(Project).where(Project.owner_id == owner.id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = apply_sort(base, sort, _PROJECT_SORTS, default="-created_at")
    stmt = stmt.limit(pagination.limit).offset(pagination.offset)
    items = list(db.scalars(stmt))
    return Page[ProjectRead](
        items=items, total=total, limit=pagination.limit, offset=pagination.offset
    )


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, owner: CurrentUser, db: DbSession) -> Project:
    """Create a new empty project owned by the authenticated user."""
    project = Project(**payload.model_dump(), owner_id=owner.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectWithStats)
def read_project(project_id: int, owner: CurrentUser, db: DbSession) -> ProjectWithStats:
    """Fetch one of the user's projects with aggregated task stats."""
    project = get_project_owned_or_404(db, project_id, owner)
    counts = dict(
        db.execute(
            select(Task.status, func.count())
            .where(Task.project_id == project.id)
            .group_by(Task.status)
        ).all()
    )
    out = ProjectWithStats.model_validate(project)
    out.total_tasks = sum(counts.values())
    out.completed_tasks = counts.get(TaskStatus.DONE, 0)
    return out


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, owner: CurrentUser, db: DbSession) -> Project:
    """Partially update a project."""
    project = get_project_owned_or_404(db, project_id, owner)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, owner: CurrentUser, db: DbSession) -> None:
    """Delete a project and cascade-delete its tasks."""
    project = get_project_owned_or_404(db, project_id, owner)
    db.delete(project)
    db.commit()
