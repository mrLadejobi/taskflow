"""Tests for task comments and discussion threads."""
import pytest


@pytest.fixture
def task_fixture(client, user_factory):
    """An authenticated user with a project and a task."""
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Comment Project"}, headers=h).json()["id"]
    tid = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "Discussable Task"}, headers=h).json()["id"]
    return h, pid, tid


def test_add_and_list_comments(task_fixture, client):
    h, pid, tid = task_fixture
    r1 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "First discussion note"},
        headers=h,
    )
    assert r1.status_code == 201
    c1 = r1.json()
    assert c1["content"] == "First discussion note"
    assert c1["task_id"] == tid

    # Reply with parent_id
    r2 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "Threaded reply", "parent_id": c1["id"]},
        headers=h,
    )
    assert r2.status_code == 201
    c2 = r2.json()
    assert c2["parent_id"] == c1["id"]

    # List comments
    r_list = client.get(f"/api/v1/tasks/{tid}/comments", headers=h)
    assert r_list.status_code == 200
    items = r_list.json()
    assert len(items) == 2
    assert items[0]["content"] == "First discussion note"


def test_edit_comment_permissions(task_fixture, client, user_factory):
    h1, pid, tid = task_fixture
    h2 = user_factory()

    c1 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "Original content"},
        headers=h1,
    ).json()

    # User 2 attempts to edit User 1's comment -> 403
    r_bad = client.patch(
        f"/api/v1/comments/{c1['id']}",
        json={"content": "Malicious edit"},
        headers=h2,
    )
    assert r_bad.status_code == 403

    # User 1 successfully edits
    r_good = client.patch(
        f"/api/v1/comments/{c1['id']}",
        json={"content": "Updated content"},
        headers=h1,
    )
    assert r_good.status_code == 200
    assert r_good.json()["content"] == "Updated content"


def test_delete_comment(task_fixture, client):
    h, pid, tid = task_fixture
    c1 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "To be deleted"},
        headers=h,
    ).json()

    r_del = client.delete(f"/api/v1/comments/{c1['id']}", headers=h)
    assert r_del.status_code == 204

    # Verify deleted
    r_list = client.get(f"/api/v1/tasks/{tid}/comments", headers=h)
    assert len(r_list.json()) == 0
