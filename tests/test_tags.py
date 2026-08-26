"""Tests for tag endpoints and task<->tag linking."""
import uuid


def _name() -> str:
    """A globally-unique tag name (tags are shared across the whole app)."""
    return "tag-" + uuid.uuid4().hex[:8]


def test_create_and_duplicate_tag(client, auth_headers):
    name = _name()
    assert client.post("/api/v1/tags", json={"name": name}, headers=auth_headers).status_code == 201
    assert client.post("/api/v1/tags", json={"name": name}, headers=auth_headers).status_code == 409


def test_list_tags_paginated(client, auth_headers):
    client.post("/api/v1/tags", json={"name": _name()}, headers=auth_headers)
    body = client.get("/api/v1/tags?limit=1", headers=auth_headers).json()
    assert set(body.keys()) == {"items", "total", "limit", "offset"}
    assert body["limit"] == 1
    assert len(body["items"]) <= 1


def test_attach_detach_and_filter(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "T"}, headers=h).json()["id"]
    tid = client.post(f"/api/v1/projects/{pid}/tasks", json={"title": "x"}, headers=h).json()["id"]

    name = _name()
    attached = client.post(f"/api/v1/tasks/{tid}/tags", json={"name": name}, headers=h)
    assert attached.status_code == 201
    assert [t["name"] for t in attached.json()["tags"]] == [name]

    # Attaching the same tag again is idempotent.
    again = client.post(f"/api/v1/tasks/{tid}/tags", json={"name": name}, headers=h)
    assert len(again.json()["tags"]) == 1

    filtered = client.get(f"/api/v1/projects/{pid}/tasks?tag={name}", headers=h).json()
    assert filtered["total"] == 1

    tag_id = attached.json()["tags"][0]["id"]
    detached = client.delete(f"/api/v1/tasks/{tid}/tags/{tag_id}", headers=h)
    assert detached.status_code == 200
    assert detached.json()["tags"] == []
    # Detaching what isn't attached -> 404.
    assert client.delete(f"/api/v1/tasks/{tid}/tags/{tag_id}", headers=h).status_code == 404


def test_delete_tag(client, auth_headers):
    tag_id = client.post("/api/v1/tags", json={"name": _name()}, headers=auth_headers).json()["id"]
    assert client.delete(f"/api/v1/tags/{tag_id}", headers=auth_headers).status_code == 204
    assert client.delete(f"/api/v1/tags/{tag_id}", headers=auth_headers).status_code == 404


def test_tags_require_auth(client):
    assert client.get("/api/v1/tags").status_code == 401
