import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-internal-token")

from fastapi.testclient import TestClient

from app.main import _paypal_base_url, app


client = TestClient(app)


def test_payments_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "payments", "status": "ok"}


def test_internal_paypal_endpoint_rejects_missing_internal_token():
    response = client.post(
        "/internal/paypal/verify",
        json={"orderId": "provider-order-id", "expectedTotal": 1000},
    )
    assert response.status_code == 401


def test_paypal_defaults_to_sandbox():
    assert "sandbox.paypal.com" in _paypal_base_url()
