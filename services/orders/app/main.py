import os
from datetime import datetime
from typing import List, Optional

import httpx
from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from pymongo import MongoClient

app = FastAPI(title="TKB Shop Orders Service", version="0.2.0")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "protel_shop")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
PAYMENTS_SERVICE_URL = os.getenv("PAYMENTS_SERVICE_URL", "http://payments:8000").rstrip("/")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database(MONGO_DB_NAME)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


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


def _require_jwt_secret() -> str:
    if not JWT_SECRET:
        raise HTTPException(500, "JWT_SECRET non configure")
    return JWT_SECRET


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


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
    user["id"] = str(user["_id"])
    return user


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


def _get_products_map(item_list: list[dict]) -> dict:
    ids = [ObjectId(item["product"]) for item in item_list]
    products = {
        str(product["_id"]): product
        for product in db.products.find({"_id": {"$in": ids}})
    }
    if len(products) != len(ids):
        raise HTTPException(400, "Produit introuvable")
    return products


def _check_stock(item_list: list[dict], products: dict) -> None:
    for item in item_list:
        product = products[item["product"]]
        stock = int(product.get("stock", 0) or 0)
        if stock < item["quantity"]:
            raise HTTPException(409, f"Stock insuffisant pour {product.get('name', 'Produit')}")


def _build_priced_items(item_list: list[dict], products: dict) -> tuple[list[dict], float]:
    normalized = []
    total = 0.0
    for item in item_list:
        product = products[item["product"]]
        price = float(product.get("price", 0) or 0)
        if price <= 0:
            raise HTTPException(400, "Prix invalide")

        image = product.get("image") or (product.get("images") or [""])[0] or ""
        normalized.append(
            {
                "product": item["product"],
                "name": product.get("name") or "",
                "quantity": item["quantity"],
                "price": price,
                "image": image,
                "size": item.get("size", "Unique"),
            }
        )
        total += price * item["quantity"]
    return normalized, total


def _decrement_stock(item_list: list[dict], strict: bool = False) -> None:
    for item in item_list:
        result = db.products.update_one(
            {
                "_id": ObjectId(item["product"]),
                "stock": {"$gte": item["quantity"]},
            },
            {"$inc": {"stock": -item["quantity"]}},
        )
        if strict and result.modified_count == 0:
            raise HTTPException(409, "Stock insuffisant")


def _verify_paypal_order(order_id: str, expected_total: float) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    try:
        response = httpx.post(
            f"{PAYMENTS_SERVICE_URL}/internal/paypal/verify",
            json={"orderId": order_id, "expectedTotal": expected_total},
            headers={"X-Internal-Token": INTERNAL_SERVICE_TOKEN},
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Payments service indisponible: {exc}")

    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except ValueError:
            detail = response.text
        raise HTTPException(response.status_code, detail or "Paiement PayPal invalide")


@app.get("/_health")
def health():
    return {"service": "orders", "status": "ok"}


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
    users_cache: dict[str, Optional[dict]] = {}

    for order in db.orders.find().sort("createdAt", -1):
        order["id"] = str(order.pop("_id"))
        user_id = order.get("userId")
        if user_id:
            if user_id not in users_cache:
                users_cache[user_id] = (
                    db.users.find_one({"_id": ObjectId(user_id)})
                    if ObjectId.is_valid(user_id)
                    else None
                )
            user = users_cache[user_id]
            if user:
                order.setdefault("userName", user.get("name"))
                order.setdefault("userEmail", user.get("email"))

        if order.get("items"):
            order.setdefault("productName", order["items"][0].get("name"))
        order.setdefault("totalPrice", order.get("totalAmount"))
        orders.append(order)

    return orders


@app.post("/api/orders")
def create_order(order: Order, user: dict = Depends(get_current_user)):
    items = _coerce_items(order.items)
    products = _get_products_map(items)
    _check_stock(items, products)
    normalized_items, total = _build_priced_items(items, products)

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
        document["status"] = "Payé"
        _decrement_stock(normalized_items, strict=True)
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
    products = _get_products_map(normalized)
    _check_stock(normalized, products)
    priced_items, total = _build_priced_items(normalized, products)
    return {"totalAmount": total, "items": priced_items}


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

    _decrement_stock(order.get("items", []), strict=False)
    return {"success": True, "alreadyProcessed": False}
