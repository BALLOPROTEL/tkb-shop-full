import os
import smtplib
import ssl
from email.message import EmailMessage

from fastapi import Depends, FastAPI, Header, HTTPException

from app.observability import install_observability
from pydantic import BaseModel, EmailStr

app = FastAPI(title="TKB Shop Notifications Service", version="0.1.0")
install_observability(app, "notifications")

INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM") or SMTP_USER or "no-reply@localhost"


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    html: str
    text: str


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


def _send_email(data: EmailRequest) -> None:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        raise HTTPException(500, "SMTP non configure")

    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = str(data.to)
    message["Subject"] = data.subject
    message.set_content(data.text)
    message.add_alternative(data.html, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(message)


@app.get("/_health")
def health():
    return {"service": "notifications", "status": "ok"}


@app.get("/ready")
def readiness():
    return {"service": "notifications", "status": "ready"}


@app.post("/internal/email")
def send_email(
    data: EmailRequest,
    _internal: None = Depends(_require_internal_token),
):
    _send_email(data)
    return {"success": True}
