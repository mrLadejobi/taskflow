"""Security test suite validating Role-Based Access Control (RBAC) tiers."""
import pytest


def test_viewer_permission_boundaries(client, user_factory):
    h_owner = user_factory()
    h_viewer = user_factory()

    # Owner creates project
    p = client.post("/api/v1/projects", json={"name": "Restricted Project"}, headers=h_owner).json()
    pid = p["id"]

    # Register viewer email
    viewer_email = client.get("/api/v1/users/me", headers=h_viewer).json()["email"]

    # Add as viewer
    client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": viewer_email, "role": "viewer"},
        headers=h_owner,
    )

    # Viewer CAN view tasks
    res_list = client.get(f"/api/v1/projects/{pid}/tasks", headers=h_viewer)
    assert res_list.status_code == 200

    # Viewer cannot manage members (admin check fails -> 403)
    r_invite = client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": "other@example.com", "role": "member"},
        headers=h_viewer,
    )
    assert r_invite.status_code == 403


def test_admin_vs_member_privileges(client, user_factory):
    h_owner = user_factory()
    h_admin = user_factory()
    h_member = user_factory()

    pid = client.post("/api/v1/projects", json={"name": "Privilege Project"}, headers=h_owner).json()["id"]

    admin_email = client.get("/api/v1/users/me", headers=h_admin).json()["email"]
    member_email = client.get("/api/v1/users/me", headers=h_member).json()["email"]

    # Owner adds admin
    client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": admin_email, "role": "admin"},
        headers=h_owner,
    )

    # Admin CAN add another member
    r_add = client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": member_email, "role": "member"},
        headers=h_admin,
    )
    assert r_add.status_code == 201

    # Member CANNOT invite new members
    r_member_invite = client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": "stranger@example.com", "role": "member"},
        headers=h_member,
    )
    assert r_member_invite.status_code == 403


def test_unauthorized_token_rejection(client):
    # Attempting to access protected endpoints without token
    assert client.get("/api/v1/notifications").status_code == 401
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/api/v1/projects").status_code == 401
    assert client.get("/api/v1/dashboard").status_code == 401
