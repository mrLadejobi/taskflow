"""Tag endpoints: global labels usable across tasks.

Tags are shared application-wide (not scoped per user or project); any
authenticated user may list, create, or delete them. See WORKLOG.md for the
rationale and the known trade-offs of this design.
"""
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from taskflow.dependencies import CurrentUser, DbSession, PaginationParams
from taskflow.models.tag import Tag
from taskflow.queries import apply_sort
from taskflow.schemas.common import Page
from taskflow.schemas.tags import TagCreate, TagOut

router = APIRouter(prefix="/tags", tags=["tags"])

_TAG_SORTS = {"name": Tag.name, "id": Tag.id}


@router.get("", response_model=Page[TagOut])
def list_tags(
    current_user: CurrentUser,
    db: DbSession,
    pagination: PaginationParams,
    sort: str | None = Query(
        default=None,
        description="Sort field; prefix with '-' for descending. Allowed: name, id.",
    ),
) -> Page[TagOut]:
    """List all tags (paginated)."""
    base = select(Tag)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = (
        apply_sort(base, sort, _TAG_SORTS, default="name")
        .limit(pagination.limit)
        .offset(pagination.offset)
    )
    items = list(db.scalars(stmt))
    return Page[TagOut](
        items=items, total=total, limit=pagination.limit, offset=pagination.offset
    )


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, current_user: CurrentUser, db: DbSession) -> Tag:
    """Create a new tag; names are unique."""
    existing = db.scalar(select(Tag).where(Tag.name == payload.name))
    if existing:
        raise HTTPException(status_code=409, detail="Tag already exists")
    tag = Tag(name=payload.name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, current_user: CurrentUser, db: DbSession) -> None:
    """Delete a tag; it is also detached from any tasks carrying it."""
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
