"""Reusable query-building helpers for SQLAlchemy select statements."""
from fastapi import HTTPException, status
from sqlalchemy import Select
from sqlalchemy.orm import InstrumentedAttribute


def apply_sort(
    stmt: Select,
    sort: str | None,
    allowed: dict[str, InstrumentedAttribute],
    default: str,
) -> Select:
    """Apply an ``ORDER BY`` clause to ``stmt`` from a client sort string.

    The sort string names a field, optionally prefixed with ``-`` for
    descending order (e.g. ``"-created_at"``). Only fields present in
    ``allowed`` may be sorted on; anything else raises HTTP 422.

    Args:
        stmt: The select statement to order.
        sort: Client-supplied sort key, or None to use ``default``.
        allowed: Mapping of sortable field name -> ORM column.
        default: Field name (with optional ``-``) used when ``sort`` is None.

    Returns:
        The statement with an ``ORDER BY`` clause applied.
    """
    key = sort or default
    descending = key.startswith("-")
    field = key[1:] if descending else key

    column = allowed.get(field)
    if column is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Cannot sort by {field!r}. "
                f"Allowed fields: {', '.join(sorted(allowed))}."
            ),
        )
    return stmt.order_by(column.desc() if descending else column.asc())


def apply_pagination(stmt: Select, limit: int, offset: int) -> Select:
    """Apply limit and offset pagination to a Select statement.

    Args:
        stmt: The select statement to paginate.
        limit: Maximum number of rows to return.
        offset: Number of initial rows to skip.

    Returns:
        The statement with LIMIT and OFFSET applied.
    """
    return stmt.limit(limit).offset(offset)

