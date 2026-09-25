"""Unit tests for query construction utilities."""
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from taskflow.models.task import Task
from taskflow.queries import apply_pagination, apply_sort


def test_apply_pagination():
    """Verify LIMIT and OFFSET are correctly affixed to select queries."""
    stmt = select(Task)
    paginated = apply_pagination(stmt, limit=25, offset=50)
    compiled = str(paginated)
    assert "LIMIT" in compiled
    assert "OFFSET" in compiled


def test_apply_sort_asc_and_desc():
    """Verify ascending and descending sorting."""
    stmt = select(Task)
    allowed = {"title": Task.title, "created_at": Task.created_at}

    # Ascending
    asc_stmt = apply_sort(stmt, "title", allowed, default="created_at")
    assert "ORDER BY tasks.title ASC" in str(asc_stmt)

    # Descending
    desc_stmt = apply_sort(stmt, "-title", allowed, default="created_at")
    assert "ORDER BY tasks.title DESC" in str(desc_stmt)


def test_apply_sort_disallowed_column():
    """Verify sorting by an unlisted column raises HTTP 422."""
    stmt = select(Task)
    allowed = {"title": Task.title}
    with pytest.raises(HTTPException) as exc:
        apply_sort(stmt, "unauthorized_column", allowed, default="title")
    assert exc.value.status_code == 422
