import os
from datetime import datetime

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient

app = FastAPI(title="TKB Shop Backoffice Service", version="0.1.0")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "protel_shop")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database(MONGO_DB_NAME)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class SiteSettings(BaseModel):
    bannerText: str


class NewsletterSignup(BaseModel):
    email: EmailStr


def _require_jwt_secret() -> str:
    if not JWT_SECRET:
        raise HTTPException(500, "JWT_SECRET non configure")
    return JWT_SECRET


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    secret = _require_jwt_secret()
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), secret, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise unauthorized
    except JWTError:
        raise unauthorized

    user = db.users.find_one({"email": email})
    if not user:
        raise unauthorized
    return user


async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Acces administrateur requis")
    return user


@app.get("/_health")
def health():
    return {"service": "backoffice", "status": "ok"}


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
    paid_statuses = [
        "Payé",
        "Livré",
        "Payé (Vérifié)",
        "PayÃ©",
        "LivrÃ©",
        "PayÃ© (VÃ©rifiÃ©)",
    ]
    revenue = list(
        db.orders.aggregate(
            [
                {"$match": {"status": {"$in": paid_statuses}}},
                {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}},
            ]
        )
    )
    return {
        "revenue": revenue[0]["total"] if revenue else 0,
        "usersCount": db.users.count_documents({}),
        "productsCount": db.products.count_documents({}),
        "ordersCount": db.orders.count_documents({}),
    }
