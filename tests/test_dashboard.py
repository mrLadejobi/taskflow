"""Tests for the dashboard summary endpoint."""


def test_dashboard_requires_auth(client):
    assert client.get("/api/v1/dashboard").status_code == 401


def test_dashboard_summary(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "D"}, headers=h).json()["id"]
    client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "a", "due_date": "2000-01-01"}, headers=h)
    client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "b", "priority": "high"}, headers=h)
    done_id = client.post(
        f"/api/v1/projects/{pid}/tasks", json={"title": "c"}, headers=h).json()["id"]
    client.post(f"/api/v1/tasks/{done_id}/complete", headers=h)

    d = client.get("/api/v1/dashboard", headers=h).json()
    assert d["projects"] == 1
    assert d["tasks"] == {"total": 3, "todo": 2, "in_progress": 0, "done": 1}
    assert d["overdue"] == 1
    assert d["assigned_to_me"] == 3
    assert d["by_priority"]["high"] == 1
