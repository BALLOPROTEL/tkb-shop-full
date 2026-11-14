import os
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from pymongo import MongoClient

app = FastAPI(title="TKB Shop Catalog Service", version="0.1.0")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "protel_shop")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

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


def _serialize_product(product: dict) -> dict:
    if "createdAt" not in product and isinstance(product.get("_id"), ObjectId):
        product["createdAt"] = product["_id"].generation_time
    product["id"] = str(product["_id"])
    product.pop("_id", None)
    return product


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


@app.get("/_health")
def health():
    return {"service": "catalog", "status": "ok"}


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
