from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_catalog_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "catalog", "status": "ok"}


def test_internal_quote_requires_service_token():
    response = client.post(
        "/internal/catalog/quote",
        json={
            "items": [
                {
                    "product": "507f1f77bcf86cd799439011",
                    "quantity": 1,
                    "size": "Unique",
                }
            ]
        },
    )
    assert response.status_code in (401, 500)


def test_internal_stock_commit_requires_service_token():
    response = client.post(
        "/internal/catalog/stock/commit",
        json={
            "idempotencyKey": "test-key",
            "items": [
                {
                    "product": "507f1f77bcf86cd799439011",
                    "quantity": 1,
                    "size": "Unique",
                }
            ],
        },
    )
    assert response.status_code in (401, 500)


def test_catalog_does_not_access_users_collection_directly():
    import inspect
    import app.main as catalog_main

    source = inspect.getsource(catalog_main)
    assert "db.users" not in source
    assert "/internal/auth/validate" in source


def test_public_api_requires_gateway_token_when_configured(monkeypatch):
    import app.main as service_main

    monkeypatch.setattr(service_main, "GATEWAY_SHARED_TOKEN", "trusted-gateway-token")
    response = client.get("/api/products")
    assert response.status_code == 403
