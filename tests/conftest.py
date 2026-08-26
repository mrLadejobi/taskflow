import itertools

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from taskflow.database import Base, get_db
from taskflow.main import app

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(
    TEST_DB_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(bind=engine)

# Monotonic sequence for generating unique registration emails across the
# session-scoped test database (no per-test teardown, so emails must not clash).
_email_seq = itertools.count(1)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a user and return Authorization headers."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_factory(client):
    """Return a callable that registers a fresh user and returns its headers.

    Each call uses a unique email, so tests that rely on per-user aggregates
    (dashboard, my-tasks, ownership checks) stay isolated from one another
    despite the shared, session-scoped test database.
    """

    def make() -> dict[str, str]:
        email = f"user{next(_email_seq)}@example.com"
        client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "password123", "full_name": "U"},
        )
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": "password123"},
        )
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return make
