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
