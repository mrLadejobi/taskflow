"""Tests for project members, role permissions, and invitations."""
import pytest


def test_member_addition_and_roles(client, user_factory):
    h_owner = user_factory(email="owner@example.com")
    h_collab = user_factory(email="collab@example.com")

    # Owner creates project
    pid = client.post("/api/v1/projects", json={"name": "Team Project"}, headers=h_owner).json()["id"]

    # Add collaborator as member
    r_add = client.post(
        f"/api/v1/projects/{pid}/members",
        json={"email": "collab@example.com", "role": "member"},
        headers=h_owner,
    )
    assert r_add.status_code == 201
    member = r_add.json()
    assert member["role"] == "member"

    # Collaborator can now access project tasks
    r_tasks = client.get(f"/api/v1/projects/{pid}/tasks", headers=h_collab)
    assert r_tasks.status_code == 200

    # Owner updates member to admin
    r_up = client.patch(
        f"/api/v1/projects/{pid}/members/{member['user_id']}",
        json={"role": "admin"},
        headers=h_owner,
    )
    assert r_up.status_code == 200
    assert r_up.json()["role"] == "admin"

    # Remove member
    r_del = client.delete(f"/api/v1/projects/{pid}/members/{member['user_id']}", headers=h_owner)
    assert r_del.status_code == 204


def test_project_invitation_flow(client, user_factory):
    h_owner = user_factory(email="inviter@example.com")
    h_invitee = user_factory(email="invitee@example.com")

    pid = client.post("/api/v1/projects", json={"name": "Invite Project"}, headers=h_owner).json()["id"]

    # Create invitation
    r_inv = client.post(
        f"/api/v1/projects/{pid}/invitations",
        json={"email": "invitee@example.com", "role": "member"},
        headers=h_owner,
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    # Invitee accepts invitation
    r_acc = client.post(
        "/api/v1/invitations/accept",
        json={"token": token},
        headers=h_invitee,
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["role"] == "member"
