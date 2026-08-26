"""Tests for project endpoints: CRUD, stats, ownership scoping."""


def test_projects_require_auth(client):
    assert client.get("/api/v1/projects").status_code == 401


def test_create_and_list_projects(client, user_factory):
    h = user_factory()
    assert client.post("/api/v1/projects", json={"name": "Alpha"}, headers=h).status_code == 201
    body = client.get("/api/v1/projects", headers=h).json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Alpha"
    assert set(body.keys()) == {"items", "total", "limit", "offset"}


def test_project_stats(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Stats"}, headers=h).json()["id"]
    for i in range(3):
        client.post(f"/api/v1/projects/{pid}/tasks", json={"title": f"t{i}"}, headers=h)
    tid = client.get(f"/api/v1/projects/{pid}/tasks", headers=h).json()["items"][0]["id"]
    client.post(f"/api/v1/tasks/{tid}/complete", headers=h)

    stats = client.get(f"/api/v1/projects/{pid}", headers=h).json()
    assert stats["total_tasks"] == 3
    assert stats["completed_tasks"] == 1


def test_update_and_delete_project(client, user_factory):
    h = user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Old"}, headers=h).json()["id"]
    updated = client.patch(f"/api/v1/projects/{pid}", json={"name": "New"}, headers=h)
    assert updated.status_code == 200 and updated.json()["name"] == "New"
    assert client.delete(f"/api/v1/projects/{pid}", headers=h).status_code == 204
    assert client.get(f"/api/v1/projects/{pid}", headers=h).status_code == 404


def test_cannot_access_others_project(client, user_factory):
    owner, other = user_factory(), user_factory()
    pid = client.post("/api/v1/projects", json={"name": "Private"}, headers=owner).json()["id"]
    assert client.get(f"/api/v1/projects/{pid}", headers=other).status_code == 404
    assert client.patch(f"/api/v1/projects/{pid}", json={"name": "x"}, headers=other).status_code == 404
    assert client.delete(f"/api/v1/projects/{pid}", headers=other).status_code == 404
