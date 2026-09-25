"""Tests for operational health and readiness probe endpoints."""
from fastapi.testclient import TestClient


def test_healthz_liveness(client: TestClient):
    """Test /healthz returns 200 pass status with service tag and timestamp."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pass"
    assert data["service"] == "taskflow-api"
    assert "timestamp" in data


def test_readyz_readiness(client: TestClient):
    """Test /readyz validates database connectivity and latency."""
    response = client.get("/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pass"
    assert data["database"] == "connected"
    assert "db_latency_ms" in data
    assert isinstance(data["db_latency_ms"], (int, float))
