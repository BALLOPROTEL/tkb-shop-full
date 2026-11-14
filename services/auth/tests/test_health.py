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
