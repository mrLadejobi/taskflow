"""Tests for CSV/JSON export and batch import endpoints."""
import pytest


def test_export_and_import_tasks(client, user_factory):
    h = user_factory()
    p = client.post("/api/v1/projects", json={"name": "Export Project"}, headers=h).json()
    pid = p["id"]

    # Import tasks
    import_payload = [
        {"title": "Imported 1", "description": "Desc 1", "priority": "high", "tags": ["ops", "backend"]},
        {"title": "Imported 2", "description": "Desc 2", "status": "in_progress"},
    ]
    r_imp = client.post(f"/api/v1/projects/{pid}/import", json=import_payload, headers=h)
    assert r_imp.status_code == 201
    assert r_imp.json()["imported"] == 2
    assert r_imp.json()["skipped"] == 0

    # Export as JSON
    r_json = client.get(f"/api/v1/projects/{pid}/export?format=json", headers=h)
    assert r_json.status_code == 200
    json_data = r_json.json()
    assert len(json_data) == 2
    assert json_data[0]["title"] == "Imported 1"

    # Export as CSV
    r_csv = client.get(f"/api/v1/projects/{pid}/export?format=csv", headers=h)
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]
    assert "Imported 1" in r_csv.text
