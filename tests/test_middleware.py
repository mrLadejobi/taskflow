"""Tests for request correlation and tracing middleware."""
import uuid
from fastapi.testclient import TestClient


def test_request_id_generated_automatically(client: TestClient):
    """Verify that a unique X-Request-ID header is generated if not sent."""
    response = client.get("/healthz")
    assert response.status_code == 200
    request_id = response.headers.get("X-Request-ID")
    assert request_id is not None
    # Validate UUID format
    parsed = uuid.UUID(request_id)
    assert str(parsed) == request_id


def test_request_id_preserved_when_provided(client: TestClient):
    """Verify that an incoming X-Request-ID header is preserved in the response."""
    custom_id = "test-correlation-id-12345"
    response = client.get("/healthz", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
