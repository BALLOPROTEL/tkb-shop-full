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
