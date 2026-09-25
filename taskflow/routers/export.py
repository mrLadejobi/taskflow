"""Router for exporting and importing project task datasets."""
import csv
import io
from datetime import date
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from taskflow.activity import log_activity
from taskflow.dependencies import CurrentUser, DbSession, get_project_accessible_or_404
from taskflow.models.tag import Tag
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.schemas.export import ImportSummary, TaskExportRow, TaskImportItem

router = APIRouter(tags=["export"])


@router.get(
    "/projects/{project_id}/export",
    summary="Export tasks to CSV or JSON",
)
def export_project_tasks(
    project_id: int,
    current_user: CurrentUser,
    db: DbSession,
    format: Literal["csv", "json"] = Query(default="json"),
):
    """Export all tasks for a project in CSV or JSON format."""
    project = get_project_accessible_or_404(db, project_id, current_user)

    stmt = (
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.tags), selectinload(Task.project))
        .order_by(Task.created_at.asc())
    )
    tasks = list(db.scalars(stmt).all())

    rows: list[TaskExportRow] = []
    for t in tasks:
        rows.append(
            TaskExportRow(
                id=t.id,
                title=t.title,
                description=t.description,
                status=t.status.value,
                priority=t.priority.value,
                due_date=str(t.due_date) if t.due_date else None,
                assignee_email=None,
                tags=",".join([tag.name for tag in t.tags]),
                created_at=t.created_at.isoformat(),
            )
        )

    if format == "json":
        return [row.model_dump() for row in rows]

    # Generate CSV stream
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["id", "title", "description", "status", "priority", "due_date", "tags", "created_at"]
    )
    for r in rows:
        writer.writerow(
            [r.id, r.title, r.description or "", r.status, r.priority, r.due_date or "", r.tags or "", r.created_at]
        )

    csv_data = output.getvalue()
    filename = f"project_{project.id}_tasks_export.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/projects/{project_id}/import",
    response_model=ImportSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Import tasks in bulk",
)
def import_project_tasks(
    project_id: int,
    items: list[TaskImportItem],
    current_user: CurrentUser,
    db: DbSession,
) -> ImportSummary:
    """Import a batch of tasks into a project."""
    project = get_project_accessible_or_404(db, project_id, current_user)

    imported = 0
    skipped = 0
    errors: list[str] = []

    for index, item in enumerate(items):
        try:
            status_enum = TaskStatus(item.status.lower())
        except ValueError:
            status_enum = TaskStatus.TODO

        try:
            priority_enum = TaskPriority(item.priority.lower())
        except ValueError:
            priority_enum = TaskPriority.MEDIUM

        try:
            task = Task(
                project_id=project.id,
                title=item.title,
                description=item.description,
                status=status_enum,
                priority=priority_enum,
                due_date=item.due_date,
            )
            db.add(task)
            db.flush()

            # Attach tags if present
            if item.tags:
                for tag_name in item.tags:
                    tag_name_clean = tag_name.strip().lower()
                    if not tag_name_clean:
                        continue
                    tag = db.scalar(select(Tag).where(Tag.name == tag_name_clean))
                    if tag is None:
                        tag = Tag(name=tag_name_clean)
                        db.add(tag)
                        db.flush()
                    task.tags.append(tag)

            imported += 1
        except Exception as e:
            skipped += 1
            errors.append(f"Row {index + 1}: {str(e)}")

    if imported > 0:
        log_activity(
            db,
            project_id=project.id,
            user_id=current_user.id,
            action="tasks_imported",
            details={"count": imported, "skipped": skipped},
        )

    db.commit()
    return ImportSummary(imported=imported, skipped=skipped, errors=errors)
