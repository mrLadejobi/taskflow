"""Activity logging helper service.

Provides a unified interface to record events and audit trails across TaskFlow.
"""
import json
from typing import Any

from sqlalchemy.orm import Session

from taskflow.models.activity import ActivityLog


def log_activity(
    db: Session,
    project_id: int,
    user_id: int,
    action: str,
    task_id: int | None = None,
    details: dict[str, Any] | str | None = None,
) -> ActivityLog:
    """Record an audit trail event in the activity stream.

    Args:
        db: Database session.
        project_id: Related project ID.
        user_id: ID of the acting user.
        action: Identifier for the action taken.
        task_id: Optional ID of the task affected.
        details: Optional dictionary or string of change details.

    Returns:
        The newly persisted ActivityLog instance.
    """
    serialized_details = None
    if isinstance(details, dict):
        serialized_details = json.dumps(details)
    elif isinstance(details, str):
        serialized_details = details

    entry = ActivityLog(
        project_id=project_id,
        user_id=user_id,
        task_id=task_id,
        action=action,
        details=serialized_details,
    )
    db.add(entry)
    db.flush()
    return entry
