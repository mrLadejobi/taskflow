"""Tests for subtasks and checklist functionality."""
import pytest


@pytest.fixture
def task_fixture(client, user_factory):
    """An authenticated user with a project and a task."""
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Subtask Project"}, headers=h).json()["id"]
    tid = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "Main Milestone Task"}, headers=h).json()["id"]
    return h, pid, tid


def test_create_and_list_subtasks(task_fixture, client):
    h, pid, tid = task_fixture

    s1 = client.post(
        f"/api/v1/tasks/{tid}/subtasks",
        json={"title": "Step 1: Planning"},
        headers=h,
    ).json()
    assert s1["title"] == "Step 1: Planning"
    assert s1["is_completed"] is False
    assert s1["position"] >= 0

    s2 = client.post(
        f"/api/v1/tasks/{tid}/subtasks",
        json={"title": "Step 2: Execution", "due_date": "2026-12-31"},
        headers=h,
    ).json()
    assert s2["title"] == "Step 2: Execution"
    assert s2["due_date"] == "2026-12-31"

    # List subtasks
    items = client.get(f"/api/v1/tasks/{tid}/subtasks", headers=h).json()
    assert len(items) == 2


def test_update_and_toggle_subtask(task_fixture, client):
    h, pid, tid = task_fixture
    sub = client.post(
        f"/api/v1/tasks/{tid}/subtasks",
        json={"title": "Initial title"},
        headers=h,
    ).json()

    # Toggle completion and rename
    updated = client.patch(
        f"/api/v1/subtasks/{sub['id']}",
        json={"title": "Updated title", "is_completed": True},
        headers=h,
    ).json()
    assert updated["title"] == "Updated title"
    assert updated["is_completed"] is True


def test_reorder_subtasks(task_fixture, client):
    h, pid, tid = task_fixture
    s1 = client.post(f"/api/v1/tasks/{tid}/subtasks", json={"title": "A"}, headers=h).json()
    s2 = client.post(f"/api/v1/tasks/{tid}/subtasks", json={"title": "B"}, headers=h).json()

    # Reorder [s2, s1]
    reordered = client.post(
        f"/api/v1/tasks/{tid}/subtasks/reorder",
        json={"subtask_ids": [s2["id"], s1["id"]]},
        headers=h,
    ).json()
    assert reordered[0]["id"] == s2["id"]
    assert reordered[0]["position"] == 0
    assert reordered[1]["id"] == s1["id"]
    assert reordered[1]["position"] == 1


def test_delete_subtask(task_fixture, client):
    h, pid, tid = task_fixture
    sub = client.post(f"/api/v1/tasks/{tid}/subtasks", json={"title": "Delete me"}, headers=h).json()

    r_del = client.delete(f"/api/v1/subtasks/{sub['id']}", headers=h)
    assert r_del.status_code == 204

    items = client.get(f"/api/v1/tasks/{tid}/subtasks", headers=h).json()
    assert len(items) == 0
