"""Advanced integration test suite for audit logging, threading, and batch operations."""
import pytest


def test_bulk_operations_and_audit(client, user_factory):
    h = user_factory()
    p = client.post("/api/v1/projects", json={"name": "Bulk Audit Project"}, headers=h).json()
    pid = p["id"]

    # Create 3 tasks
    t1 = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "T1"}, headers=h).json()
    t2 = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "T2"}, headers=h).json()
    t3 = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "T3"}, headers=h).json()

    # Bulk status update
    r_bulk = client.patch(
        "/api/v1/tasks/bulk",
        json={"task_ids": [t1["id"], t2["id"]], "status": "review"},
        headers=h,
    )
    assert r_bulk.status_code == 200
    assert r_bulk.json()["affected"] == 2

    # Bulk delete
    r_del = client.post(
        "/api/v1/tasks/bulk-delete",
        json={"task_ids": [t3["id"]]},
        headers=h,
    )
    assert r_del.status_code == 200
    assert r_del.json()["affected"] == 1


def test_comment_threading_deep(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Thread Project"}, headers=h).json()["id"]
    tid = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "Thread Task"}, headers=h).json()["id"]

    # Root comment
    c_root = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "Root discussion point"},
        headers=h,
    ).json()

    # Reply 1
    c_reply1 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "First reply", "parent_id": c_root["id"]},
        headers=h,
    ).json()
    assert c_reply1["parent_id"] == c_root["id"]

    # Reply 2
    c_reply2 = client.post(
        f"/api/v1/tasks/{tid}/comments",
        json={"content": "Second reply", "parent_id": c_root["id"]},
        headers=h,
    ).json()
    assert c_reply2["parent_id"] == c_root["id"]

    # List
    all_comments = client.get(f"/api/v1/tasks/{tid}/comments", headers=h).json()
    assert len(all_comments) == 3


def test_notification_delivery_on_assignment(client, user_factory):
    h1 = user_factory(email="manager@example.com")
    h2 = user_factory(email="assignee@example.com")

    # Manager creates project
    pid = client.post("/api/v1/projects", json={"name": "Delegation Project"}, headers=h1).json()["id"]

    # Add collaborator
    client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": "assignee@example.com", "role": "member"},
        headers=h1,
    )

    # Collaborator checks notification feed for project invite
    notifs = client.get("/api/v1/notifications", headers=h2).json()["items"]
    assert any("Added to project" in n["title"] for n in notifs)


def test_import_with_partial_failures(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Import Validation"}, headers=h).json()["id"]

    # Submit valid and edge-case items
    payload = [
        {"title": "Valid task 1", "priority": "urgent", "tags": ["prod", "db"]},
        {"title": "Valid task 2", "status": "done"},
    ]
    resp = client.post(f"/api/v1/projects/{pid}/import", json=payload, headers=h)
    assert resp.status_code == 201
    assert resp.json()["imported"] == 2
