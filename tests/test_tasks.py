"""Tests for task endpoints: filtering, sorting, pagination, lifecycle, bulk."""
import pytest


@pytest.fixture
def project(client, user_factory):
    """A fresh authenticated user with one empty project: (headers, project_id)."""
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "P"}, headers=h).json()["id"]
    return h, pid


def _create(client, h, pid, title="task", **kw):
    body = {"title": title, **kw}
    return client.post(f"/api/v1/projects/{pid}/tasks", json=body, headers=h)


def test_create_task_defaults(project, client):
    h, pid = project
    data = _create(client, h, pid, title="First", priority="high").json()
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["tags"] == []


def test_filters(project, client):
    h, pid = project
    _create(client, h, pid, title="overdue-one", due_date="2000-01-01")
    _create(client, h, pid, title="future", due_date="2999-01-01", priority="low")
    _create(client, h, pid, title="searchable widget")

    def titles(query):
        return [t["title"] for t in client.get(
            f"/api/v1/projects/{pid}/tasks?{query}", headers=h).json()["items"]]

    assert titles("overdue=true") == ["overdue-one"]
    assert titles("priority=low") == ["future"]
    assert titles("q=widget") == ["searchable widget"]
    assert titles("due_before=2500-01-01") == ["overdue-one"]
    assert titles("status=todo") and "future" in titles("status=todo")


def test_sort_and_bad_sort(project, client):
    h, pid = project
    for t in ["b", "a", "c"]:
        _create(client, h, pid, title=t)
    titles = [t["title"] for t in client.get(
        f"/api/v1/projects/{pid}/tasks?sort=title", headers=h).json()["items"]]
    assert titles == ["a", "b", "c"]
    assert client.get(f"/api/v1/projects/{pid}/tasks?sort=nope", headers=h).status_code == 422


def test_pagination(project, client):
    h, pid = project
    for i in range(5):
        _create(client, h, pid, title=f"t{i}")
    body = client.get(f"/api/v1/projects/{pid}/tasks?limit=2&offset=0", headers=h).json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["limit"] == 2


def test_get_single_and_404(project, client):
    h, pid = project
    tid = _create(client, h, pid).json()["id"]
    assert client.get(f"/api/v1/tasks/{tid}", headers=h).status_code == 200
    assert client.get("/api/v1/tasks/99999999", headers=h).status_code == 404


def test_complete_and_reopen(project, client):
    h, pid = project
    tid = _create(client, h, pid).json()["id"]
    done = client.post(f"/api/v1/tasks/{tid}/complete", headers=h).json()
    assert done["status"] == "done" and done["completed_at"] is not None
    reopened = client.post(f"/api/v1/tasks/{tid}/reopen", headers=h).json()
    assert reopened["status"] == "todo" and reopened["completed_at"] is None


def test_update_status_stamps_completed_at(project, client):
    h, pid = project
    tid = _create(client, h, pid).json()["id"]
    done = client.patch(f"/api/v1/tasks/{tid}", json={"status": "done"}, headers=h).json()
    assert done["completed_at"] is not None
    reopened = client.patch(
        f"/api/v1/tasks/{tid}", json={"status": "in_progress"}, headers=h).json()
    assert reopened["completed_at"] is None


def test_bulk_update_and_delete(project, client):
    h, pid = project
    ids = [_create(client, h, pid, title=f"t{i}").json()["id"] for i in range(3)]
    updated = client.patch(
        "/api/v1/tasks/bulk", json={"task_ids": ids, "status": "done"}, headers=h)
    assert updated.status_code == 200
    assert updated.json() == {"requested": 3, "affected": 3}

    deleted = client.post(
        "/api/v1/tasks/bulk-delete", json={"task_ids": ids + [123456789]}, headers=h)
    assert deleted.json() == {"requested": 4, "affected": 3}
    assert client.get(f"/api/v1/projects/{pid}/tasks", headers=h).json()["total"] == 0


def test_bulk_ignores_unowned_tasks(client, user_factory):
    owner, other = user_factory(), user_factory()
    pid = client.post("/api/v1/projects", json={"name": "O"}, headers=owner).json()["id"]
    tid = client.post(
        f"/api/v1/projects/{pid}/tasks", json={"title": "x"}, headers=owner).json()["id"]
    result = client.patch(
        "/api/v1/tasks/bulk", json={"task_ids": [tid], "status": "done"}, headers=other)
    assert result.json() == {"requested": 1, "affected": 0}


def test_my_tasks(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Mine"}, headers=h).json()["id"]
    client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "assigned"}, headers=h)
    body = client.get("/api/v1/users/me/tasks", headers=h).json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "assigned"
