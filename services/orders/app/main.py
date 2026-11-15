import os
from datetime import datetime
from typing import List, Optional

import httpx
from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from pymongo import MongoClient

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop Orders Service", version="0.3.0")
install_observability(app, "orders")


def _service_url(name: str, default: str) -> str:
    value = os.getenv(name, default).rstrip("/")
    if "://" not in value:
        value = f"https://{value}"
    return value


GATEWAY_SHARED_TOKEN = os.getenv("GATEWAY_SHARED_TOKEN")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "tkb_orders")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
PAYMENTS_SERVICE_URL = _service_url("PAYMENTS_SERVICE_URL", "http://payments:8000")
CATALOG_SERVICE_URL = _service_url("CATALOG_SERVICE_URL", "http://catalog:8000")
AUTH_SERVICE_URL = _service_url("AUTH_SERVICE_URL", "http://auth:8000")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database(MONGO_DB_NAME)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@app.middleware("http")
async def require_gateway_for_public_api(request: Request, call_next):
    if GATEWAY_SHARED_TOKEN and request.url.path.startswith("/api/"):
        if request.headers.get("x-gateway-token") != GATEWAY_SHARED_TOKEN:
            return JSONResponse(status_code=403, content={"detail": "Gateway requis"})
    return await call_next(request)


class OrderItem(BaseModel):
    product: str
    name: Optional[str] = ""
    quantity: int
    price: Optional[float] = 0
    image: Optional[str] = ""
    size: Optional[str] = "Unique"


class Order(BaseModel):
    items: List[OrderItem]
    totalAmount: float
    paymentMethod: str
    shippingAddress: str
    phone: str
    status: str = "En attente"
    paymentId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)


class PaymentCompletedRequest(BaseModel):
    paymentId: Optional[str] = None


class CheckoutContextRequest(BaseModel):
    userEmail: str


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return _internal_post(
        f"{AUTH_SERVICE_URL}/internal/auth/validate",
        {"token": token},
    )

async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Acces administrateur requis")
    return user


def _coerce_items(items: list) -> list[dict]:
    normalized = []
    if not items:
        raise HTTPException(400, "Panier vide")

    for item in items:
        if isinstance(item, dict):
            product_id = str(item.get("product", "")).strip()
            quantity = int(item.get("quantity", 0))
            size = item.get("size") or "Unique"
        else:
            product_id = str(item.product).strip()
            quantity = int(item.quantity)
            size = getattr(item, "size", None) or "Unique"

        if not ObjectId.is_valid(product_id):
            raise HTTPException(400, "Produit invalide")
        if quantity <= 0:
            raise HTTPException(400, "Quantite invalide")

        normalized.append(
            {
                "product": product_id,
                "quantity": quantity,
                "size": size,
            }
        )
    return normalized


def _internal_post(url: str, payload: dict) -> dict:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    try:
        response = httpx.post(
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


def _catalog_quote(items: list[dict]) -> dict:
    return _internal_post(
        f"{CATALOG_SERVICE_URL}/internal/catalog/quote",
        {"items": items},
    )


def _catalog_commit_stock(items: list[dict], key: str) -> dict:
    return _internal_post(
        f"{CATALOG_SERVICE_URL}/internal/catalog/stock/commit",
        {
            "items": items,
            "idempotencyKey": key,
        },
    )


def _verify_paypal_order(order_id: str, expected_total: float) -> None:
    _internal_post(
        f"{PAYMENTS_SERVICE_URL}/internal/paypal/verify",
        {"orderId": order_id, "expectedTotal": expected_total},
    )


@app.get("/_health")
def health():
    return {"service": "orders", "status": "ok"}


@app.get("/ready")
def readiness():
    db.command("ping")
    return {"service": "orders", "status": "ready"}


@app.get("/api/orders/my-orders")
def get_my_orders(user: dict = Depends(get_current_user)):
    orders = []
    for order in db.orders.find({"userId": user["id"]}).sort("createdAt", -1):
        order["id"] = str(order.pop("_id"))
        orders.append(order)
    return orders


@app.get("/api/admin/orders")
def get_admin_orders(_admin: dict = Depends(get_current_admin)):
    orders = []
    for order in db.orders.find().sort("createdAt", -1):
        order["id"] = str(order.pop("_id"))
        if order.get("items"):
            order.setdefault("productName", order["items"][0].get("name"))
        order.setdefault("totalPrice", order.get("totalAmount"))
        orders.append(order)
    return orders

@app.post("/api/orders")
def create_order(order: Order, user: dict = Depends(get_current_user)):
    items = _coerce_items(order.items)
    quote = _catalog_quote(items)
    normalized_items = quote["items"]
    total = quote["totalAmount"]

    document = order.model_dump()
    document["items"] = normalized_items
    document["totalAmount"] = total
    document["userId"] = user["id"]
    document["userName"] = user.get("name")
    document["userEmail"] = user.get("email")
    document["createdAt"] = datetime.now()

    if document.get("paymentMethod") == "PayPal":
        payment_id = document.get("paymentId")
        if not payment_id:
            raise HTTPException(400, "paymentId manquant")
        _verify_paypal_order(payment_id, total)
        _catalog_commit_stock(normalized_items, f"paypal:{payment_id}")
        document["status"] = "Payé"
    else:
        document["status"] = "En attente"

    result = db.orders.insert_one(document)
    return {
        "success": True,
        "id": str(result.inserted_id),
        "totalAmount": total,
    }


@app.post("/api/orders/quote")
def quote_order(data: dict, _user: dict = Depends(get_current_user)):
    items = data.get("items", []) if isinstance(data, dict) else []
    normalized = _coerce_items(items)
    return _catalog_quote(normalized)


@app.put("/api/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    data: dict,
    _admin: dict = Depends(get_current_admin),
):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(400, "Format d'ID invalide")

    value = data.get("status") if isinstance(data, dict) else None
    if not value:
        raise HTTPException(400, "Statut manquant")

    result = db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": value}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Commande introuvable")
    return {"success": True}


@app.post("/internal/orders/{order_id}/checkout-context")
def checkout_context(
    order_id: str,
    data: CheckoutContextRequest,
    _internal: None = Depends(_require_internal_token),
):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(400, "Commande invalide")

    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Commande introuvable")
    if order.get("userEmail") != data.userEmail:
        raise HTTPException(403, "Commande non autorisee")

    items = order.get("items") or []
    if not items:
        raise HTTPException(400, "Commande vide")

    return {
        "orderId": order_id,
        "items": items,
        "totalAmount": order.get("totalAmount", 0),
        "status": order.get("status"),
    }


@app.get("/internal/orders/stats")
def internal_orders_stats(_internal: None = Depends(_require_internal_token)):
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
        "ordersCount": db.orders.count_documents({}),
        "revenue": revenue[0]["total"] if revenue else 0,
    }


@app.post("/internal/orders/{order_id}/payment-completed")
def payment_completed(
    order_id: str,
    data: PaymentCompletedRequest,
    _internal: None = Depends(_require_internal_token),
):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(400, "Commande invalide")

    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Commande introuvable")

    paid_statuses = {"Payé", "Livré", "PayÃ©", "LivrÃ©"}
    if order.get("status") in paid_statuses:
        return {"success": True, "alreadyProcessed": True}

    stock_result = _catalog_commit_stock(
        order.get("items", []),
        f"order-payment:{order_id}",
    )

    result = db.orders.update_one(
        {
            "_id": ObjectId(order_id),
            "status": {"$nin": list(paid_statuses)},
        },
        {
            "$set": {
                "status": "Payé",
                "paymentId": data.paymentId,
            }
        },
    )
    if result.modified_count == 0:
        return {"success": True, "alreadyProcessed": True}

    return {
        "success": True,
        "alreadyProcessed": bool(stock_result.get("alreadyProcessed")),
    }
