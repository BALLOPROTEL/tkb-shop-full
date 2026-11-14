from fastapi.testclient import TestClient

from app.main import (
    AUTH_SERVICE_URL,
    BACKOFFICE_SERVICE_URL,
    CATALOG_SERVICE_URL,
    ORDERS_SERVICE_URL,
    PAYMENTS_SERVICE_URL,
    _target_for,
    app,
)


client = TestClient(app)


def test_gateway_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "gateway", "status": "ok"}
    assert response.headers["x-request-id"]


def test_gateway_preserves_caller_request_id():
    response = client.get("/_health", headers={"X-Request-ID": "trace-test-123"})
    assert response.status_code == 200
    assert response.headers["x-request-id"] == "trace-test-123"


def test_gateway_readiness():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"service": "gateway", "status": "ready"}


def test_catalog_routing():
    assert _target_for("products") == (CATALOG_SERVICE_URL, "catalog")
    assert _target_for("products/507f1f77bcf86cd799439011") == (
        CATALOG_SERVICE_URL,
        "catalog",
    )


def test_auth_routing():
    for path in (
        "auth/login",
        "auth/register",
        "auth/forgot-password",
        "auth/reset-password",
        "users/me",
        "admin/invites",
        "admin/invites/accept",
        "admin/users",
        "admin/users/507f1f77bcf86cd799439011",
    ):
        assert _target_for(path) == (AUTH_SERVICE_URL, "auth")


def test_orders_routing():
    for path in (
        "orders",
        "orders/quote",
        "orders/my-orders",
        "orders/507f1f77bcf86cd799439011/status",
        "admin/orders",
    ):
        assert _target_for(path) == (ORDERS_SERVICE_URL, "orders")


def test_payments_routing():
    for path in (
        "payments/create-stripe-session",
        "payments/stripe-webhook",
    ):
        assert _target_for(path) == (PAYMENTS_SERVICE_URL, "payments")


def test_backoffice_routing():
    for path in (
        "settings",
        "newsletter",
        "admin/newsletter",
        "admin/stats",
    ):
        assert _target_for(path) == (BACKOFFICE_SERVICE_URL, "backoffice")


def test_unknown_routes_do_not_fall_back_to_legacy():
    assert _target_for("legacy-only") == (None, "unknown")
    response = client.get("/api/legacy-only")
    assert response.status_code == 404
    assert response.headers["x-tkb-route"] == "unknown"
