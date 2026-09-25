"""Tests for overdue and upcoming task reminder query builders."""
from datetime import date, timedelta
from sqlalchemy.orm import Session

from taskflow.models.project import Project
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.models.user import User
from taskflow.reminders import overdue_tasks_query, upcoming_tasks_query


def test_reminders_overdue_and_upcoming(db: Session):
    """Verify overdue and upcoming task queries correctly filter tasks."""
    user = User(email="test_reminders@example.com", hashed_password="pw", full_name="Tester")
    db.add(user)
    db.commit()

    proj = Project(name="Reminder Project", owner_id=user.id)
    db.add(proj)
    db.commit()

    today = date(2026, 6, 1)

    # 1. Overdue task
    overdue_task = Task(
        title="Overdue Task",
        project_id=proj.id,
        assignee_id=user.id,
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
        due_date=date(2026, 5, 20),
    )

    # 2. Upcoming task within 7 days
    upcoming_task = Task(
        title="Upcoming Task",
        project_id=proj.id,
        assignee_id=user.id,
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.MEDIUM,
        due_date=date(2026, 6, 4),
    )

    # 3. Far future task (beyond 7 days)
    far_future_task = Task(
        title="Far Future Task",
        project_id=proj.id,
        assignee_id=user.id,
        status=TaskStatus.TODO,
        priority=TaskPriority.LOW,
        due_date=date(2026, 6, 25),
    )

    # 4. Completed task (even if past due)
    done_task = Task(
        title="Completed Task",
        project_id=proj.id,
        assignee_id=user.id,
        status=TaskStatus.DONE,
        priority=TaskPriority.HIGH,
        due_date=date(2026, 5, 10),
    )

    db.add_all([overdue_task, upcoming_task, far_future_task, done_task])
    db.commit()

    # Query overdue
    overdue_results = list(db.scalars(overdue_tasks_query(user.id, current_date=today)).all())
    assert len(overdue_results) == 1
    assert overdue_results[0].title == "Overdue Task"

    # Query upcoming (7 days)
    upcoming_results = list(db.scalars(upcoming_tasks_query(user.id, days_ahead=7, current_date=today)).all())
    assert len(upcoming_results) == 1
    assert upcoming_results[0].title == "Upcoming Task"
