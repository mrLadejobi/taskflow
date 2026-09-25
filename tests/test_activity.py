"""Tests for activity logs and audit timeline endpoints."""
import pytest


def test_activity_logging(client, user_factory):
    h = user_factory()
    # Create project
    p = client.post("/api/v1/projects", json={"name": "Activity Project"}, headers=h).json()
    pid = p["id"]

    # Create task
    t = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "Action Task"}, headers=h).json()
    tid = t["id"]

    # Add comment and subtask (should trigger activity logs)
    client.post(f"/api/v1/tasks/{tid}/comments", json={"content": "Log me"}, headers=h)
    client.post(f"/api/v1/tasks/{tid}/subtasks", json={"title": "Sub action"}, headers=h)

    # Fetch project activity
    res_proj = client.get(f"/api/v1/projects/{pid}/activity", headers=h)
    assert res_proj.status_code == 200
    p_body = res_proj.json()
    assert p_body["total"] >= 2
    actions = [item["action"] for item in p_body["items"]]
    assert "comment_added" in actions
    assert "subtask_created" in actions

    # Fetch task-specific activity
    res_task = client.get(f"/api/v1/tasks/{tid}/activity", headers=h)
    assert res_task.status_code == 200
    t_items = res_task.json()
    assert len(t_items) >= 2
