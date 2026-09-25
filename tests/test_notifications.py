"""Tests for notifications and user settings."""
import pytest


def test_notifications_and_settings(client, user_factory):
    h = user_factory()

    # Get settings (defaults created automatically)
    r_set = client.get("/api/v1/users/me/settings", headers=h)
    assert r_set.status_code == 200
    s_data = r_set.json()
    assert s_data["theme"] == "system"

    # Update settings
    r_up = client.patch(
        "/api/v1/users/me/settings",
        json={"theme": "dark", "compact_view": True},
        headers=h,
    )
    assert r_up.status_code == 200
    assert r_up.json()["theme"] == "dark"
    assert r_up.json()["compact_view"] is True

    # List notifications
    r_notif = client.get("/api/v1/notifications", headers=h)
    assert r_notif.status_code == 200
    assert r_notif.json()["total"] >= 0

    # Unread count
    r_count = client.get("/api/v1/notifications/unread-count", headers=h)
    assert r_count.status_code == 200
    assert "unread_count" in r_count.json()

    # Read all
    r_read_all = client.post("/api/v1/notifications/read-all", headers=h)
    assert r_read_all.status_code == 200
