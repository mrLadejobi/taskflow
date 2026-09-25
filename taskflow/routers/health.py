"""Health and readiness probe router for operational monitoring."""
from datetime import datetime, timezone
import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from taskflow.database import get_db

router = APIRouter(tags=["health"])


@router.get("/healthz")
def liveness_check() -> dict:
    """Liveness probe: verifies the service process is up and responding."""
    return {
        "status": "pass",
        "service": "taskflow-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/readyz")
def readiness_check(db: Session = Depends(get_db)) -> dict:
    """Readiness probe: validates database connectivity and operational readiness."""
    start_time = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "pass",
            "service": "taskflow-api",
            "database": "connected",
            "db_latency_ms": db_latency_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "fail",
                "service": "taskflow-api",
                "database": "unreachable",
                "error": str(exc),
            },
        )
