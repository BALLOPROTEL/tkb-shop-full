import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-internal-token")

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import _coerce_items, app


client = TestClient(app)


def test_orders_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "orders", "status": "ok"}


def test_internal_payment_completion_rejects_missing_internal_token():
    response = client.post(
        "/internal/orders/507f1f77bcf86cd799439011/payment-completed",
        json={"paymentId": "pi_test"},
    )
    assert response.status_code == 401


def test_quote_rejects_invalid_product_id_before_database_access():
    with pytest.raises(HTTPException) as exc:
        _coerce_items([{"product": "not-an-object-id", "quantity": 1}])
    assert exc.value.status_code == 400


def test_quote_rejects_non_positive_quantity():
    with pytest.raises(HTTPException) as exc:
        _coerce_items(
            [{"product": "507f1f77bcf86cd799439011", "quantity": 0}]
        )
    assert exc.value.status_code == 400


def test_orders_source_has_no_direct_products_collection_access():
    import inspect
    import app.main as orders_main

    source = inspect.getsource(orders_main)
    assert "db.products" not in source
    assert "/internal/catalog/quote" in source
    assert "/internal/catalog/stock/commit" in source


def test_source_propagates_request_id():
    import inspect
    import app.main as service_main

    source = inspect.getsource(service_main)
    assert "X-Request-ID" in source


def test_orders_does_not_access_users_collection_directly():
    import inspect
    import app.main as orders_main

    source = inspect.getsource(orders_main)
    assert "db.users" not in source
    assert "/internal/auth/validate" in source


def test_public_api_requires_gateway_token_when_configured(monkeypatch):
    import app.main as service_main

    monkeypatch.setattr(service_main, "GATEWAY_SHARED_TOKEN", "trusted-gateway-token")
    response = client.get("/api/orders")
    assert response.status_code == 403
