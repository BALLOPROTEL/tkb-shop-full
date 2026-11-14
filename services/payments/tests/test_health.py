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


def test_payments_source_has_no_mongo_persistence_access():
    import inspect
    import app.main as payments_main

    source = inspect.getsource(payments_main)
    assert "MongoClient" not in source
    assert "db.users" not in source
    assert "db.orders" not in source
    assert "/checkout-context" in source


def test_source_propagates_request_id():
    import inspect
    import app.main as service_main

    source = inspect.getsource(service_main)
    assert "X-Request-ID" in source


def test_payments_source_delegates_identity_to_auth():
    import inspect
    import app.main as payments_main

    source = inspect.getsource(payments_main)
    assert "JWT_SECRET" not in source
    assert "jwt.decode" not in source
    assert "/internal/auth/validate" in source
