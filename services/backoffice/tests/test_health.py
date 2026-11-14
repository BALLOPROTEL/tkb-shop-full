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


def test_backoffice_source_aggregates_via_service_contracts():
    import inspect
    import app.main as backoffice_main

    source = inspect.getsource(backoffice_main)
    assert "db.users" not in source
    assert "db.products" not in source
    assert "db.orders" not in source
    assert "/internal/auth/stats" in source
    assert "/internal/catalog/stats" in source
    assert "/internal/orders/stats" in source
