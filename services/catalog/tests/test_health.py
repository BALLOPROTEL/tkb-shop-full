from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_catalog_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "catalog", "status": "ok"}
