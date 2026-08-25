"""Database engine and session management.

Provides the SQLAlchemy engine, a declarative base for ORM models,
and dependency-injectable session factories for FastAPI routes.
"""
from collections.abc import Generator

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from taskflow.config import settings

# Naming convention ensures deterministic constraint names in migrations.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Declarative base class shared by all ORM models."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session.

    Ensures the session is always closed after the request completes,
    even when handlers raise exceptions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables defined by registered models.

    Import all model modules before calling this so their tables
    are present on ``Base.metadata``.
    """
    from taskflow.models import user, project, task  # noqa: F401

    Base.metadata.create_all(bind=engine)
