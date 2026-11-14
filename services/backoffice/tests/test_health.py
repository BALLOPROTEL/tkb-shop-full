from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_backoffice_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "backoffice", "status": "ok"}


def test_admin_stats_requires_authentication():
    response = client.get("/api/admin/stats")
    assert response.status_code == 401
