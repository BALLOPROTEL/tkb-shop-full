from fastapi.testclient import TestClient

from app.main import _sanitize_user, app


client = TestClient(app)


def test_auth_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "auth", "status": "ok"}


def test_sanitize_user_never_exposes_password():
    result = _sanitize_user(
        {
            "_id": "abc",
            "email": "user@example.com",
            "password": "secret",
            "role": "client",
        }
    )
    assert result["email"] == "user@example.com"
    assert "password" not in result


def test_source_propagates_request_id():
    import inspect
    import app.main as service_main

    source = inspect.getsource(service_main)
    assert "X-Request-ID" in source


def test_public_api_requires_gateway_token_when_configured(monkeypatch):
    import app.main as service_main

    monkeypatch.setattr(service_main, "GATEWAY_SHARED_TOKEN", "trusted-gateway-token")
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 403
