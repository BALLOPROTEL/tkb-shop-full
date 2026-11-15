import pytest

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


def test_send_notification_waits_for_notifications_before_sending(monkeypatch):
    import app.main as service_main

    calls = {"wait": 0, "post": 0}

    def fake_wait():
        calls["wait"] += 1
        return True

    class FakeResponse:
        status_code = 200

    def fake_post(*args, **kwargs):
        calls["post"] += 1
        return FakeResponse()

    monkeypatch.setattr(service_main, "INTERNAL_SERVICE_TOKEN", "internal-token")
    monkeypatch.setattr(service_main, "_wait_for_notifications_health", fake_wait)
    monkeypatch.setattr(service_main.httpx, "post", fake_post)

    service_main._send_notification(
        "user@example.com",
        "Reset",
        "<p>Reset</p>",
        "Reset",
    )

    assert calls == {"wait": 1, "post": 1}


def test_send_notification_never_exposes_render_html(monkeypatch):
    import app.main as service_main

    class FakeResponse:
        status_code = 502
        text = "<!DOCTYPE html><html><title>502</title></html>"

    monkeypatch.setattr(service_main, "INTERNAL_SERVICE_TOKEN", "internal-token")
    monkeypatch.setattr(service_main, "_wait_for_notifications_health", lambda: True)
    monkeypatch.setattr(service_main.httpx, "post", lambda *args, **kwargs: FakeResponse())

    with pytest.raises(service_main.HTTPException) as exc:
        service_main._send_notification(
            "user@example.com",
            "Reset",
            "<p>Reset</p>",
            "Reset",
        )

    assert exc.value.status_code == 503
    assert "<!DOCTYPE" not in str(exc.value.detail)
    assert "Service email" in str(exc.value.detail)


def test_send_notification_does_not_post_while_notifications_is_asleep(monkeypatch):
    import app.main as service_main

    def unexpected_post(*args, **kwargs):
        raise AssertionError("Email must not be sent before notifications is healthy")

    monkeypatch.setattr(service_main, "INTERNAL_SERVICE_TOKEN", "internal-token")
    monkeypatch.setattr(service_main, "_wait_for_notifications_health", lambda: False)
    monkeypatch.setattr(service_main.httpx, "post", unexpected_post)

    with pytest.raises(service_main.HTTPException) as exc:
        service_main._send_notification(
            "user@example.com",
            "Reset",
            "<p>Reset</p>",
            "Reset",
        )

    assert exc.value.status_code == 503
    assert "demarrage" in str(exc.value.detail)
