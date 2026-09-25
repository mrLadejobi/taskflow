"""Router for task comments and discussion threads."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from taskflow.activity import log_activity
from taskflow.dependencies import CurrentUser, DbSession, get_task_accessible_or_404
from taskflow.models.comment import Comment
from taskflow.models.notification import Notification, NotificationType
from taskflow.schemas.comment import CommentCreate, CommentRead, CommentUpdate

router = APIRouter(tags=["comments"])


@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a task",
)
def add_comment(
    task_id: int,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> Comment:
    """Add a new discussion comment or reply to a task."""
    task = get_task_accessible_or_404(db, task_id, current_user)

    if payload.parent_id is not None:
        parent = db.get(Comment, payload.parent_id)
        if parent is None or parent.task_id != task_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found on this task",
            )

    comment = Comment(
        task_id=task_id,
        author_id=current_user.id,
        content=payload.content,
        parent_id=payload.parent_id,
    )
    db.add(comment)
    db.flush()

    # Log activity
    log_activity(
        db,
        project_id=task.project_id,
        user_id=current_user.id,
        action="comment_added",
        task_id=task.id,
        details={"comment_id": comment.id, "preview": payload.content[:80]},
    )

    # Notify task assignee if not the commenting user
    if task.assignee_id and task.assignee_id != current_user.id:
        notification = Notification(
            user_id=task.assignee_id,
            title=f"New comment on '{task.title}'",
            message=f"{current_user.full_name or current_user.email} commented: {payload.content[:100]}",
            type=NotificationType.COMMENT_ADDED,
            link=f"/projects/{task.project_id}?task={task.id}",
        )
        db.add(notification)

    db.commit()
    db.refresh(comment)
    return comment


@router.get(
    "/tasks/{task_id}/comments",
    response_model=list[CommentRead],
    summary="List comments for a task",
)
def list_comments(
    task_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[Comment]:
    """Retrieve all comments and discussion threads attached to a task."""
    get_task_accessible_or_404(db, task_id, current_user)

    stmt = (
        select(Comment)
        .where(Comment.task_id == task_id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at.asc())
    )
    comments = list(db.scalars(stmt).all())
    return comments


@router.patch(
    "/comments/{comment_id}",
    response_model=CommentRead,
    summary="Update a comment",
)
def update_comment(
    comment_id: int,
    payload: CommentUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> Comment:
    """Edit the content of an existing comment (author only)."""
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments",
        )

    comment.content = payload.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a comment",
)
def delete_comment(
    comment_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Remove a comment (author or project owner)."""
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    # Check permission: author or owner of parent project
    task = get_task_accessible_or_404(db, comment.task_id, current_user)
    if comment.author_id != current_user.id and task.project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment",
        )

    db.delete(comment)
    db.commit()
