"""Project CRUD endpoints, scoped to the authenticated owner."""
from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from taskflow.dependencies import CurrentUser, DbSession, get_project_owned_or_404
from taskflow.models.project import Project
from taskflow.models.task import Task, TaskStatus
from taskflow.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    ProjectWithStats,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(owner: CurrentUser, db: DbSession) -> list[Project]:
    """List all projects belonging to the authenticated user."""
    stmt = select(Project).where(Project.owner_id == owner.id).order_by(Project.created_at.desc())
    return list(db.scalars(stmt))


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
    total = db.scalar(select(func.count()).select_from(Task).where(Task.project_id == project.id)) or 0
    done = db.scalar(
        select(func.count()).select_from(Task).where(
            Task.project_id == project.id, Task.status == TaskStatus.DONE
        )
    ) or 0
    out = ProjectWithStats.model_validate(project)
    out.total_tasks = total
    out.completed_tasks = done
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
