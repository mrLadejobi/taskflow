"""Helper queries for discovering overdue and imminent tasks."""
from datetime import date, timedelta
from sqlalchemy import Select, and_, select

from taskflow.models.task import Task, TaskStatus


def overdue_tasks_query(user_id: int, current_date: date | None = None) -> Select:
    """Build a select query for unfinished tasks whose due date has passed."""
    today = current_date or date.today()
    return (
        select(Task)
        .where(
            and_(
                Task.assignee_id == user_id,
                Task.status != TaskStatus.DONE,
                Task.due_date.isnot(None),
                Task.due_date < today,
            )
        )
        .order_by(Task.due_date.asc())
    )


def upcoming_tasks_query(
    user_id: int, days_ahead: int = 7, current_date: date | None = None
) -> Select:
    """Build a select query for unfinished tasks due within the next N days."""
    today = current_date or date.today()
    cutoff = today + timedelta(days=days_ahead)
    return (
        select(Task)
        .where(
            and_(
                Task.assignee_id == user_id,
                Task.status != TaskStatus.DONE,
                Task.due_date.isnot(None),
                Task.due_date >= today,
                Task.due_date <= cutoff,
            )
        )
        .order_by(Task.due_date.asc())
    )
