"""TaskFlow application entry point.

Creates and configures the FastAPI app, mounts all routers under the
configured API prefix, and initializes the database on startup.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from taskflow.config import settings
from taskflow.database import init_db
from taskflow.routers import auth, projects, tasks, users

logger = logging.getLogger("taskflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables before serving requests."""
    logger.info("Initializing database...")
    init_db()
    yield
    logger.info("Shutting down TaskFlow.")


def create_app() -> FastAPI:
    """Application factory assembling middleware and routers."""
    app = FastAPI(
        title=settings.app_name,
        description="RESTful task management API.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = settings.api_prefix
    app.include_router(auth.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(projects.router, prefix=prefix)
    app.include_router(tasks.router, prefix=prefix)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
