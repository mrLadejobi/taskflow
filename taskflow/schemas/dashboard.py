"""Pydantic schemas for the dashboard summary."""
from pydantic import BaseModel


class StatusCounts(BaseModel):
    """Task counts broken down by lifecycle status."""

    total: int = 0
    todo: int = 0
    in_progress: int = 0
    review: int = 0
    done: int = 0


class DashboardSummary(BaseModel):
    """An at-a-glance summary for the authenticated user.

    Attributes:
        projects: Number of projects the user owns.
        tasks: Status breakdown of tasks across the user's owned projects.
        by_priority: Task counts keyed by priority value.
        overdue: Tasks past their due date and not done (in owned projects).
        assigned_to_me: Tasks assigned to the user across all projects.
    """

    projects: int = 0
    tasks: StatusCounts = StatusCounts()
    by_priority: dict[str, int] = {}
    overdue: int = 0
    assigned_to_me: int = 0
