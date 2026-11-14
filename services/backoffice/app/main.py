import os
from datetime import datetime

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop Backoffice Service", version="0.2.0")
install_observability(app, "backoffice")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "protel_shop")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8000").rstrip("/")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://catalog:8000").rstrip("/")
ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://orders:8000").rstrip("/")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database(MONGO_DB_NAME)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class SiteSettings(BaseModel):
    bannerText: str


class NewsletterSignup(BaseModel):
    email: EmailStr


def _internal_request(method: str, url: str, payload: dict | None = None) -> dict:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    try:
        response = httpx.request(
            method,
            url,
            json=payload,
            headers={
                "X-Internal-Token": INTERNAL_SERVICE_TOKEN,
                "X-Request-ID": get_request_id() or "",
            },
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Service interne indisponible: {exc}")

    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except ValueError:
            detail = response.text
        raise HTTPException(response.status_code, detail or "Erreur service interne")
    return response.json()


async def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    user = _internal_request(
        "POST",
        f"{AUTH_SERVICE_URL}/internal/auth/validate",
        {"token": token},
    )
    if user.get("role") != "admin":
        raise HTTPException(403, "Acces administrateur requis")
    return user


@app.get("/_health")
def health():
    return {"service": "backoffice", "status": "ok"}


@app.get("/ready")
def readiness():
    db.command("ping")
    return {"service": "backoffice", "status": "ready"}


@app.get("/api/settings")
def get_settings():
    settings = db.settings.find_one({"_id": "global_settings"})
    return {
        "bannerText": settings.get("bannerText")
        if settings
        else "Bienvenue chez TKB SHOP"
    }


@app.post("/api/settings")
def update_settings(
    settings: SiteSettings,
    _admin: dict = Depends(get_current_admin),
):
    db.settings.update_one(
        {"_id": "global_settings"},
        {"$set": {"bannerText": settings.bannerText}},
        upsert=True,
    )
    return {"success": True}


@app.post("/api/newsletter")
def subscribe_newsletter(data: NewsletterSignup):
    email = data.email.lower().strip()
    if db.newsletter.find_one({"email": email}):
        return {"success": True, "already": True}

    db.newsletter.insert_one(
        {
            "email": email,
            "createdAt": datetime.now(),
        }
    )
    return {"success": True}


@app.get("/api/admin/newsletter")
def list_newsletter(_admin: dict = Depends(get_current_admin)):
    items = []
    for item in db.newsletter.find().sort("createdAt", -1):
        item["id"] = str(item.pop("_id"))
        items.append(item)
    return items


@app.get("/api/admin/stats")
def get_stats(_admin: dict = Depends(get_current_admin)):
    auth_stats = _internal_request("GET", f"{AUTH_SERVICE_URL}/internal/auth/stats")
    catalog_stats = _internal_request("GET", f"{CATALOG_SERVICE_URL}/internal/catalog/stats")
    orders_stats = _internal_request("GET", f"{ORDERS_SERVICE_URL}/internal/orders/stats")
    return {
        "revenue": orders_stats.get("revenue", 0),
        "usersCount": auth_stats.get("usersCount", 0),
        "productsCount": catalog_stats.get("productsCount", 0),
        "ordersCount": orders_stats.get("ordersCount", 0),
    }
