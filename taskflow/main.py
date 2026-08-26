"""TaskFlow application entry point.

Creates and configures the FastAPI app, mounts all routers under the
configured API prefix, installs request logging, and initializes the
database on startup.
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from taskflow.config import settings
from taskflow.database import init_db
from taskflow.routers import auth, dashboard, projects, tags, tasks, users

logger = logging.getLogger("taskflow")

_DEFAULT_SECRET = "change-me-in-production"


def configure_logging() -> None:
    """Install a basic console log format for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate configuration and initialize database tables at startup."""
    if settings.secret_key == _DEFAULT_SECRET:
        if settings.debug:
            logger.warning(
                "SECRET_KEY is the insecure default; set a real SECRET_KEY "
                "before deploying."
            )
        else:
            raise RuntimeError(
                "SECRET_KEY must be changed from its default when debug is off."
            )

    logger.info("Initializing database...")
    init_db()
    yield
    logger.info("Shutting down TaskFlow.")


def create_app() -> FastAPI:
    """Application factory assembling middleware and routers."""
    configure_logging()

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

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log method, path, status, and latency for every request."""
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %d (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response

    prefix = settings.api_prefix
    app.include_router(auth.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(projects.router, prefix=prefix)
    app.include_router(tasks.router, prefix=prefix)
    app.include_router(tags.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
