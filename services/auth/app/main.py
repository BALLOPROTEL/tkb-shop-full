import hashlib
import os
import secrets
import smtplib
import ssl
import time

import httpx
from bson import ObjectId
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop Auth Service", version="0.1.0")
install_observability(app, "auth")


def _service_url(name: str, default: str) -> str:
    value = os.getenv(name, default).rstrip("/")
    if "://" not in value:
        value = f"https://{value}"
    return value


GATEWAY_SHARED_TOKEN = os.getenv("GATEWAY_SHARED_TOKEN")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "tkb_auth")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
RESET_PASSWORD_DEBUG = os.getenv("RESET_PASSWORD_DEBUG", "0") == "1"
ADMIN_INVITE_EXPIRE_MINUTES = int(os.getenv("ADMIN_INVITE_EXPIRE_MINUTES", "5"))

CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173").rstrip("/")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
NOTIFICATIONS_SERVICE_URL = _service_url("NOTIFICATIONS_SERVICE_URL", "http://notifications:8000")

RESET_RATE_LIMIT_WINDOW_SEC = int(os.getenv("RESET_RATE_LIMIT_WINDOW_SEC", "600"))
RESET_RATE_LIMIT_MAX = int(os.getenv("RESET_RATE_LIMIT_MAX", "5"))
ADMIN_INVITE_RATE_LIMIT_WINDOW_SEC = int(os.getenv("ADMIN_INVITE_RATE_LIMIT_WINDOW_SEC", "600"))
ADMIN_INVITE_RATE_LIMIT_MAX = int(os.getenv("ADMIN_INVITE_RATE_LIMIT_MAX", "5"))


@app.middleware("http")
async def require_gateway_for_public_api(request: Request, call_next):
    if GATEWAY_SHARED_TOKEN and request.url.path.startswith("/api/"):
        if request.headers.get("x-gateway-token") != GATEWAY_SHARED_TOKEN:
            return JSONResponse(status_code=403, content={"detail": "Gateway requis"})
    return await call_next(request)


mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database(MONGO_DB_NAME)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
_rate_limit_store: dict[str, list[float]] = {}


class UserRegister(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    name: Optional[str] = None
    email: EmailStr
    password: str
    phone: Optional[str] = None
    country: Optional[str] = None
    countryDial: Optional[str] = None
    acceptTerms: Optional[bool] = None
    acceptSalesPolicy: Optional[bool] = None
    acceptMarketing: Optional[bool] = None
    acceptOrderTracking: Optional[bool] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    countryDial: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class AdminInviteRequest(BaseModel):
    email: EmailStr


class AdminInviteAccept(BaseModel):
    token: str


class InternalTokenValidation(BaseModel):
    token: str


def _utcnow() -> datetime:
    return datetime.utcnow()


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


def _require_jwt_secret() -> str:
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET non configure",
        )
    return JWT_SECRET


def _sanitize_user(user: dict) -> dict:
    return {
        "id": str(user.get("_id")),
        "name": user.get("name"),
        "firstName": user.get("firstName"),
        "lastName": user.get("lastName"),
        "email": user.get("email"),
        "role": user.get("role", "client"),
        "phone": user.get("phone"),
        "country": user.get("country"),
        "countryDial": user.get("countryDial"),
        "consents": user.get("consents"),
    }


def _create_access_token(email: str) -> str:
    secret = _require_jwt_secret()
    payload = {
        "sub": email,
        "exp": _utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _allow_rate_limit(key: str, max_hits: int, window_seconds: int) -> bool:
    if max_hits <= 0:
        return True
    now = time.time()
    hits = [t for t in _rate_limit_store.get(key, []) if now - t < window_seconds]
    if len(hits) >= max_hits:
        _rate_limit_store[key] = hits
        return False
    hits.append(now)
    _rate_limit_store[key] = hits
    return True


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded:
        return forwarded
    if request.client:
        return request.client.host
    return "unknown"


def _send_notification(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")

    try:
        response = httpx.post(
            f"{NOTIFICATIONS_SERVICE_URL}/internal/email",
            json={
                "to": to_email,
                "subject": subject,
                "html": html_body,
                "text": text_body,
            },
            headers={
                "X-Internal-Token": INTERNAL_SERVICE_TOKEN,
                "X-Request-ID": get_request_id() or "",
            },
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Notifications service indisponible: {exc}")

    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except ValueError:
            detail = response.text
        raise HTTPException(
            502,
            detail or "Echec de l'envoi de notification",
        )


def _email_template(title: str, message: str, action_text: str, action_url: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;background:#f6f2ee;padding:32px">
      <div style="max-width:620px;margin:auto;background:#fff;border-radius:16px;padding:32px">
        <div style="font-size:20px;font-weight:700;letter-spacing:2px">TKB SHOP</div>
        <h2>{title}</h2>
        <p style="line-height:1.6">{message}</p>
        <p>
          <a href="{action_url}"
             style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">
            {action_text}
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280">Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
      </div>
    </div>
    """


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    secret = _require_jwt_secret()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), secret, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.users.find_one({"email": email})
    if not user:
        raise credentials_exception
    user["id"] = str(user["_id"])
    return user


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acces administrateur requis")
    return current_user


@app.get("/_health")
def health():
    return {"service": "auth", "status": "ok"}


@app.get("/ready")
def readiness():
    db.command("ping")
    return {"service": "auth", "status": "ready"}


@app.post("/internal/auth/validate")
def internal_validate_token(
    data: InternalTokenValidation,
    _internal: None = Depends(_require_internal_token),
):
    secret = _require_jwt_secret()
    try:
        payload = jwt.decode(
            data.token.replace("Bearer ", ""),
            secret,
            algorithms=[JWT_ALGORITHM],
        )
        email = payload.get("sub")
        if not email:
            raise ValueError("missing subject")
    except (JWTError, ValueError):
        raise HTTPException(401, "Session invalide")

    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(401, "Session invalide")
    return _sanitize_user(user)


@app.get("/internal/auth/stats")
def internal_auth_stats(_internal: None = Depends(_require_internal_token)):
    return {"usersCount": db.users.count_documents({})}


@app.post("/api/auth/register")
def register(user: UserRegister):
    email = user.email.lower().strip()
    if db.users.find_one({"email": email}):
        raise HTTPException(400, "Email deja enregistre")

    full_name = (user.name or "").strip()
    if not full_name:
        full_name = f"{(user.firstName or '').strip()} {(user.lastName or '').strip()}".strip()
    if not full_name:
        raise HTTPException(400, "Nom invalide")
    if len(user.password) < 6:
        raise HTTPException(400, "Mot de passe trop court")

    now = _utcnow()
    document = {
        "name": full_name,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": email,
        "password": pwd_context.hash(user.password),
        "role": "client",
        "createdAt": now,
        "phone": user.phone,
        "country": user.country,
        "countryDial": user.countryDial,
        "consents": {
            "terms": bool(user.acceptTerms),
            "salesPolicy": bool(user.acceptSalesPolicy),
            "marketing": bool(user.acceptMarketing),
            "orderTracking": bool(user.acceptOrderTracking),
        },
        "consentsUpdatedAt": now,
    }
    db.users.insert_one(document)
    return {"success": True}


@app.post("/api/auth/login")
def login(user: UserLogin):
    email = user.email.lower().strip()
    record = db.users.find_one({"email": email})
    if not record or not pwd_context.verify(user.password, record["password"]):
        raise HTTPException(400, "Email ou mot de passe incorrect")

    return {
        "access_token": _create_access_token(record["email"]),
        "token_type": "bearer",
        "user": _sanitize_user(record),
    }


@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest, request: Request):
    email = data.email.lower().strip()
    ip = _client_ip(request)

    allowed_ip = _allow_rate_limit(
        f"reset_ip:{ip}",
        RESET_RATE_LIMIT_MAX,
        RESET_RATE_LIMIT_WINDOW_SEC,
    )
    allowed_email = _allow_rate_limit(
        f"reset_email:{email}",
        RESET_RATE_LIMIT_MAX,
        RESET_RATE_LIMIT_WINDOW_SEC,
    )
    if not allowed_ip or not allowed_email:
        raise HTTPException(429, "Trop de demandes. Reessayez plus tard.")

    user = db.users.find_one({"email": email})
    if not user:
        return {"success": True}

    token = secrets.token_urlsafe(32)
    token_hash = _hash_token(token)
    expires_at = _utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

    db.password_resets.delete_many({"userId": user["_id"], "usedAt": None})
    db.password_resets.insert_one(
        {
            "userId": user["_id"],
            "tokenHash": token_hash,
            "expiresAt": expires_at,
            "createdAt": _utcnow(),
            "usedAt": None,
        }
    )

    reset_url = f"{CLIENT_URL}/reset-password?token={token}"
    html = _email_template(
        "Reinitialisation du mot de passe",
        f"Ce lien expire dans {RESET_TOKEN_EXPIRE_MINUTES} minutes.",
        "Reinitialiser",
        reset_url,
    )
    try:
        _send_notification(
            email,
            "Reinitialisation de votre mot de passe",
            html,
            f"Reinitialisez votre mot de passe : {reset_url}",
        )
    except Exception:
        db.password_resets.delete_one({"tokenHash": token_hash})
        raise

    response = {"success": True, "expiresIn": RESET_TOKEN_EXPIRE_MINUTES}
    if RESET_PASSWORD_DEBUG:
        response["resetToken"] = token
    return response


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordRequest):
    token = (data.token or "").strip()
    if not token:
        raise HTTPException(400, "Token manquant")
    if len(data.password) < 6:
        raise HTTPException(400, "Mot de passe trop court")

    token_hash = _hash_token(token)
    reset = db.password_resets.find_one(
        {
            "tokenHash": token_hash,
            "usedAt": None,
            "expiresAt": {"$gt": _utcnow()},
        }
    )
    if not reset:
        raise HTTPException(400, "Token invalide ou expire")

    db.users.update_one(
        {"_id": reset["userId"]},
        {"$set": {"password": pwd_context.hash(data.password)}},
    )
    db.password_resets.update_one(
        {"_id": reset["_id"]},
        {"$set": {"usedAt": _utcnow()}},
    )
    return {"success": True}


@app.get("/api/users/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return _sanitize_user(current_user)


@app.put("/api/users/me")
def update_me(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update: dict = {}
    for field in ("firstName", "lastName", "name", "phone", "country", "countryDial"):
        value = getattr(data, field)
        if value is not None:
            update[field] = value

    if "name" not in update and (data.firstName is not None or data.lastName is not None):
        first = data.firstName if data.firstName is not None else current_user.get("firstName") or ""
        last = data.lastName if data.lastName is not None else current_user.get("lastName") or ""
        full_name = f"{first} {last}".strip()
        if full_name:
            update["name"] = full_name

    if update:
        db.users.update_one({"_id": current_user["_id"]}, {"$set": update})
        current_user = db.users.find_one({"_id": current_user["_id"]})

    return _sanitize_user(current_user)


@app.post("/api/admin/invites")
def create_admin_invite(
    data: AdminInviteRequest,
    request: Request,
    admin: dict = Depends(get_current_admin),
):
    email = data.email.lower().strip()
    ip = _client_ip(request)

    allowed_ip = _allow_rate_limit(
        f"admin_invite_ip:{ip}",
        ADMIN_INVITE_RATE_LIMIT_MAX,
        ADMIN_INVITE_RATE_LIMIT_WINDOW_SEC,
    )
    allowed_email = _allow_rate_limit(
        f"admin_invite_email:{email}",
        ADMIN_INVITE_RATE_LIMIT_MAX,
        ADMIN_INVITE_RATE_LIMIT_WINDOW_SEC,
    )
    if not allowed_ip or not allowed_email:
        raise HTTPException(429, "Trop de demandes. Reessayez plus tard.")

    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    if user.get("role") == "admin":
        raise HTTPException(400, "Deja administrateur")

    token = secrets.token_urlsafe(32)
    token_hash = _hash_token(token)
    expires_at = _utcnow() + timedelta(minutes=ADMIN_INVITE_EXPIRE_MINUTES)

    db.admin_invites.delete_many({"userId": user["_id"], "usedAt": None})
    db.admin_invites.insert_one(
        {
            "userId": user["_id"],
            "email": email,
            "tokenHash": token_hash,
            "expiresAt": expires_at,
            "createdAt": _utcnow(),
            "usedAt": None,
            "invitedBy": admin.get("_id"),
        }
    )

    invite_url = f"{CLIENT_URL}/admin-invite?token={token}"
    html = _email_template(
        "Invitation administrateur",
        f"Cette invitation expire dans {ADMIN_INVITE_EXPIRE_MINUTES} minutes.",
        "Devenir admin",
        invite_url,
    )
    try:
        _send_notification(
            email,
            "Invitation administrateur TKB SHOP",
            html,
            f"Invitation admin TKB SHOP : {invite_url}",
        )
    except Exception:
        db.admin_invites.delete_one({"tokenHash": token_hash})
        raise

    return {"success": True, "expiresIn": ADMIN_INVITE_EXPIRE_MINUTES}


@app.post("/api/admin/invites/accept")
def accept_admin_invite(data: AdminInviteAccept):
    token = (data.token or "").strip()
    if not token:
        raise HTTPException(400, "Token manquant")

    token_hash = _hash_token(token)
    invite = db.admin_invites.find_one(
        {
            "tokenHash": token_hash,
            "usedAt": None,
            "expiresAt": {"$gt": _utcnow()},
        }
    )
    if not invite:
        raise HTTPException(400, "Token invalide ou expire")

    db.users.update_one({"_id": invite["userId"]}, {"$set": {"role": "admin"}})
    db.admin_invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"usedAt": _utcnow()}},
    )
    return {"success": True}


@app.get("/api/admin/users")
def get_admin_users(_admin: dict = Depends(get_current_admin)):
    return [_sanitize_user(user) for user in db.users.find()]


@app.delete("/api/admin/users/{user_id}")
def delete_admin_user(
    user_id: str,
    _admin: dict = Depends(get_current_admin),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Format d'ID invalide")
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Utilisateur introuvable")
    return {"success": True}
