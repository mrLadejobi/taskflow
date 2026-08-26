"""Dashboard summary endpoint aggregating the user's workload."""
from datetime import date

from fastapi import APIRouter
from sqlalchemy import func, select

from taskflow.dependencies import CurrentUser, DbSession
from taskflow.models.project import Project
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.schemas.dashboard import DashboardSummary, StatusCounts

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummary)
def get_dashboard(owner: CurrentUser, db: DbSession) -> DashboardSummary:
    """Return an at-a-glance summary for the authenticated user."""
    owned_project_ids = select(Project.id).where(Project.owner_id == owner.id)

    projects = (
        db.scalar(
            select(func.count()).select_from(Project).where(Project.owner_id == owner.id)
        )
        or 0
    )

    status_rows = db.execute(
        select(Task.status, func.count())
        .where(Task.project_id.in_(owned_project_ids))
        .group_by(Task.status)
    ).all()
    status_map = {status: count for status, count in status_rows}
    tasks = StatusCounts(
        total=sum(status_map.values()),
        todo=status_map.get(TaskStatus.TODO, 0),
        in_progress=status_map.get(TaskStatus.IN_PROGRESS, 0),
        review=status_map.get(TaskStatus.REVIEW, 0),
        done=status_map.get(TaskStatus.DONE, 0),
    )

    priority_rows = db.execute(
        select(Task.priority, func.count())
        .where(Task.project_id.in_(owned_project_ids))
        .group_by(Task.priority)
    ).all()
    by_priority = {priority.value: 0 for priority in TaskPriority}
    for priority, count in priority_rows:
        by_priority[priority.value] = count

    overdue = (
        db.scalar(
            select(func.count())
            .select_from(Task)
            .where(
                Task.project_id.in_(owned_project_ids),
                Task.due_date.is_not(None),
                Task.due_date < date.today(),
                Task.status != TaskStatus.DONE,
            )
        )
        or 0
    )

    assigned_to_me = (
        db.scalar(
            select(func.count()).select_from(Task).where(Task.assignee_id == owner.id)
        )
        or 0
    )

    return DashboardSummary(
        projects=projects,
        tasks=tasks,
        by_priority=by_priority,
        overdue=overdue,
        assigned_to_me=assigned_to_me,
    )
