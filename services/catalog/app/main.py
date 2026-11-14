import os
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException, status

from app.observability import install_observability
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

app = FastAPI(title="TKB Shop Catalog Service", version="0.2.0")
install_observability(app, "catalog")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "protel_shop")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")

client = MongoClient(MONGO_URI)
db = client.get_database(MONGO_DB_NAME)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Product(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    categoryGroup: Optional[str] = None
    subcategory: Optional[str] = None
    price: float
    oldPrice: Optional[float] = None
    stock: int = 0
    image: str = ""
    images: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
    status: str = "Active"
    colors: List[str] = Field(default_factory=list)
    sizes: List[str] = Field(default_factory=list)


class CatalogItemRequest(BaseModel):
    product: str
    quantity: int
    size: Optional[str] = "Unique"


class CatalogItemsRequest(BaseModel):
    items: List[CatalogItemRequest]


class StockCommitRequest(CatalogItemsRequest):
    idempotencyKey: str


def _serialize_product(product: dict) -> dict:
    if "createdAt" not in product and isinstance(product.get("_id"), ObjectId):
        product["createdAt"] = product["_id"].generation_time
    product["id"] = str(product["_id"])
    product.pop("_id", None)
    return product


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


def _require_admin(token: str = Depends(oauth2_scheme)) -> dict:
    if not JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET non configure",
        )
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise ValueError("missing subject")
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Session invalide")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acces administrateur requis")
    return user


def _normalize_items(items: List[CatalogItemRequest]) -> tuple[list[dict], float]:
    if not items:
        raise HTTPException(400, "Panier vide")

    ids = []
    for item in items:
        if not ObjectId.is_valid(item.product):
            raise HTTPException(400, "Produit invalide")
        if item.quantity <= 0:
            raise HTTPException(400, "Quantite invalide")
        ids.append(ObjectId(item.product))

    products = {
        str(product["_id"]): product
        for product in db.products.find({"_id": {"$in": ids}})
    }
    if len(products) != len(ids):
        raise HTTPException(400, "Produit introuvable")

    normalized = []
    total = 0.0
    for item in items:
        product = products[item.product]
        stock = int(product.get("stock", 0) or 0)
        if stock < item.quantity:
            raise HTTPException(
                409,
                f"Stock insuffisant pour {product.get('name', 'Produit')}",
            )

        price = float(product.get("price", 0) or 0)
        if price <= 0:
            raise HTTPException(400, "Prix invalide")

        image = product.get("image") or (product.get("images") or [""])[0] or ""
        normalized.append(
            {
                "product": item.product,
                "name": product.get("name") or "",
                "quantity": item.quantity,
                "price": price,
                "image": image,
                "size": item.size or "Unique",
            }
        )
        total += price * item.quantity

    return normalized, total


@app.get("/_health")
def health():
    return {"service": "catalog", "status": "ok"}


@app.get("/internal/catalog/stats")
def internal_catalog_stats(_internal: None = Depends(_require_internal_token)):
    return {"productsCount": db.products.count_documents({})}


@app.post("/internal/catalog/quote")
def internal_quote(
    request: CatalogItemsRequest,
    _internal: None = Depends(_require_internal_token),
):
    items, total = _normalize_items(request.items)
    return {"items": items, "totalAmount": total}


@app.post("/internal/catalog/stock/commit")
def internal_stock_commit(
    request: StockCommitRequest,
    _internal: None = Depends(_require_internal_token),
):
    key = request.idempotencyKey.strip()
    if not key:
        raise HTTPException(400, "idempotencyKey manquante")

    db.stock_commits.create_index("key", unique=True)

    try:
        db.stock_commits.insert_one(
            {
                "key": key,
                "status": "processing",
                "createdAt": datetime.utcnow(),
            }
        )
    except DuplicateKeyError:
        existing = db.stock_commits.find_one({"key": key}) or {}
        if existing.get("status") == "completed":
            return {"success": True, "alreadyProcessed": True}
        raise HTTPException(409, "Stock commit deja en cours")

    applied: list[CatalogItemRequest] = []
    try:
        _normalize_items(request.items)
        for item in request.items:
            result = db.products.update_one(
                {
                    "_id": ObjectId(item.product),
                    "stock": {"$gte": item.quantity},
                },
                {"$inc": {"stock": -item.quantity}},
            )
            if result.modified_count == 0:
                raise HTTPException(409, "Stock insuffisant")
            applied.append(item)

        db.stock_commits.update_one(
            {"key": key},
            {
                "$set": {
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                }
            },
        )
        return {"success": True, "alreadyProcessed": False}
    except Exception:
        for item in applied:
            db.products.update_one(
                {"_id": ObjectId(item.product)},
                {"$inc": {"stock": item.quantity}},
            )
        db.stock_commits.delete_one({"key": key})
        raise


@app.get("/api/products")
def get_products():
    return [_serialize_product(product) for product in db.products.find().sort("_id", -1)]


@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Format d'ID invalide")
    product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(404, "Produit introuvable")
    return _serialize_product(product)


@app.post("/api/products")
def create_product(product: Product, _admin: dict = Depends(_require_admin)):
    data = product.model_dump(exclude={"id"})
    data.setdefault("createdAt", datetime.now())
    result = db.products.insert_one(data)
    return {"success": True, "id": str(result.inserted_id)}


@app.put("/api/products/{product_id}")
def update_product(product_id: str, product: Product, _admin: dict = Depends(_require_admin)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Format d'ID invalide")
    data = product.model_dump(exclude={"id"})
    result = db.products.update_one({"_id": ObjectId(product_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(404, "Produit introuvable")
    return {"success": True}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: str, _admin: dict = Depends(_require_admin)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Format d'ID invalide")
    result = db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Produit introuvable")
    return {"success": True}
