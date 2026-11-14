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


def test_catalog_source_uses_auth_contract_not_user_collection():
    import inspect
    import app.main as catalog_main

    source = inspect.getsource(catalog_main)
    assert "db.users" not in source
    assert "JWT_SECRET" not in source
    assert "/internal/auth/validate" in source
