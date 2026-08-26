"""Shared, reusable Pydantic schemas."""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A paginated slice of a larger collection.

    Attributes:
        items: The rows for the current page.
        total: Total number of rows matching the query (ignoring limit/offset).
        limit: Maximum rows requested per page.
        offset: Number of rows skipped before this page.
    """

    items: list[T]
    total: int
    limit: int
    offset: int


class Message(BaseModel):
    """A simple human-readable status message."""

    detail: str
