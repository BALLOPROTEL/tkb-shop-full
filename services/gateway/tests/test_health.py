import httpx
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


class FakeResponse:
    def __init__(self, status_code=200, content=b"[]", headers=None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "application/json"}


def test_gateway_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "gateway", "status": "ok"}
    assert response.headers["x-request-id"]


def test_gateway_preserves_caller_request_id():
    response = client.get("/_health", headers={"X-Request-ID": "trace-test-123"})
    assert response.status_code == 200
    assert response.headers["x-request-id"] == "trace-test-123"


def test_gateway_readiness_checks_dependencies(monkeypatch):
    async def fake_get(self, url, headers=None):
        assert headers["X-Request-ID"] == "ready-trace"
        return FakeResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    response = client.get("/ready", headers={"X-Request-ID": "ready-trace"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert all(payload["dependencies"].values())


def test_gateway_readiness_fails_when_dependency_is_down(monkeypatch):
    async def fake_get(self, url, headers=None):
        status_code = 503 if "orders" in url else 200
        return FakeResponse(status_code=status_code)

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    response = client.get("/ready")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["dependencies"]["orders"] is False


def test_gateway_propagates_request_id_to_upstream(monkeypatch):
    async def fake_request(
        self,
        method,
        url,
        params=None,
        content=None,
        headers=None,
    ):
        assert headers["x-request-id"] == "proxy-trace-123"
        return FakeResponse()

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)
    response = client.get(
        "/api/products",
        headers={"X-Request-ID": "proxy-trace-123"},
    )

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "proxy-trace-123"


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


def test_gateway_overrides_client_gateway_token(monkeypatch):
    import app.main as service_main

    monkeypatch.setattr(service_main, "GATEWAY_SHARED_TOKEN", "trusted-gateway-token")

    async def fake_request(
        self,
        method,
        url,
        params=None,
        content=None,
        headers=None,
    ):
        assert headers["x-gateway-token"] == "trusted-gateway-token"
        return FakeResponse()

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)
    response = client.get(
        "/api/products",
        headers={"X-Gateway-Token": "client-supplied-token"},
    )

    assert response.status_code == 200
