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


def test_source_propagates_request_id():
    import inspect
    import app.main as service_main

    source = inspect.getsource(service_main)
    assert "X-Request-ID" in source


def test_public_api_requires_gateway_token_when_configured(monkeypatch):
    import app.main as service_main

    monkeypatch.setattr(service_main, "GATEWAY_SHARED_TOKEN", "trusted-gateway-token")
    response = client.get("/api/settings")
    assert response.status_code == 403
