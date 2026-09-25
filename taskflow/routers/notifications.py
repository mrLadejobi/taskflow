"""Router for user notifications and preference settings."""
from fastapi import APIRouter, status
from sqlalchemy import func, select, update

from taskflow.dependencies import CurrentUser, DbSession, PaginationParams
from taskflow.models.notification import Notification, UserSettings
from taskflow.schemas.common import Page
from taskflow.schemas.notification import (
    NotificationCount,
    NotificationRead,
    UserSettingsRead,
    UserSettingsUpdate,
)

router = APIRouter(tags=["notifications"])


@router.get(
    "/notifications",
    response_model=Page[NotificationRead],
    summary="List in-app notifications",
)
def list_notifications(
    pagination: PaginationParams,
    current_user: CurrentUser,
    db: DbSession,
) -> Page[NotificationRead]:
    """Retrieve paginated notifications for the current user."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )

    total = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id
        )
    ) or 0
    items = list(
        db.scalars(stmt.offset(pagination.offset).limit(pagination.limit)).all()
    )

    return Page[NotificationRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get(
    "/notifications/unread-count",
    response_model=NotificationCount,
    summary="Get unread notifications count",
)
def get_unread_count(
    current_user: CurrentUser,
    db: DbSession,
) -> NotificationCount:
    """Return count of unread notifications for badge display."""
    count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    ) or 0
    return NotificationCount(unread_count=count)


@router.post(
    "/notifications/{notification_id}/read",
    response_model=NotificationRead,
    summary="Mark single notification as read",
)
def mark_notification_read(
    notification_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> Notification:
    """Mark a notification as read."""
    notif = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    if notif:
        notif.mark_read()
        db.commit()
        db.refresh(notif)
    return notif


@router.post(
    "/notifications/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications as read",
)
def mark_all_notifications_read(
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, str]:
    """Mark all unread notifications as read for current user."""
    db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    db.commit()
    return {"status": "ok"}


@router.get(
    "/users/me/settings",
    response_model=UserSettingsRead,
    summary="Get user preference settings",
)
def get_user_settings(
    current_user: CurrentUser,
    db: DbSession,
) -> UserSettings:
    """Retrieve notification and appearance preferences."""
    settings = db.scalar(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    if settings is None:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.patch(
    "/users/me/settings",
    response_model=UserSettingsRead,
    summary="Update user preference settings",
)
def update_user_settings(
    payload: UserSettingsUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> UserSettings:
    """Update notification and appearance preferences."""
    settings = db.scalar(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    if settings is None:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if payload.email_notifications is not None:
        settings.email_notifications = payload.email_notifications
    if payload.task_assigned_alerts is not None:
        settings.task_assigned_alerts = payload.task_assigned_alerts
    if payload.status_change_alerts is not None:
        settings.status_change_alerts = payload.status_change_alerts
    if payload.theme is not None:
        settings.theme = payload.theme
    if payload.compact_view is not None:
        settings.compact_view = payload.compact_view

    db.commit()
    db.refresh(settings)
    return settings
