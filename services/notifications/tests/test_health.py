import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-internal-token")

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_notifications_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "notifications", "status": "ok"}


def test_email_endpoint_rejects_missing_internal_token():
    response = client.post(
        "/internal/email",
        json={
            "to": "user@example.com",
            "subject": "Test",
            "html": "<p>Test</p>",
            "text": "Test",
        },
    )
    assert response.status_code == 401
