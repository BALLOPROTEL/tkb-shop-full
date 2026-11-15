import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-internal-token")
os.environ.setdefault("SMTP_HOST", "smtp-relay.brevo.com")
os.environ.setdefault("SMTP_USER", "test@example.com")
os.environ.setdefault("SMTP_PASS", "test-smtp-key")

from fastapi.testclient import TestClient

import app.main as notifications_main
from app.main import app


client = TestClient(app)


def test_notifications_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "notifications", "status": "ok"}


def test_notifications_ready():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"service": "notifications", "status": "ready"}


def test_notifications_not_ready_without_smtp_password(monkeypatch):
    monkeypatch.setattr(notifications_main, "SMTP_PASS", None)
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json() == {
        "service": "notifications",
        "status": "not_ready",
        "missing": ["SMTP_PASS"],
    }


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
