from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pathlib import Path
from jose import JWTError, jwt
import os
import json
import base64
import urllib.request
import urllib.parse
import urllib.error
import stripe
import sentry_sdk
from dotenv import load_dotenv # Indispensable pour lire le fichier .env
from sentry_sdk.integrations.fastapi import FastApiIntegration
# --- 1. CONFIGURATION ET CHARGEMENT ---
# Rigueur : Charger le .env avant toute chose
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False
)

SECRET_KEY = os.getenv("JWT_SECRET", "TKB_PRIVATE_KEY_2026_SECURE_99_STAY_RIGOROUS")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 heures

# CORS (ne pas utiliser "*" avec credentials)
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    CORS_ORIGINS = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    CORS_ORIGINS = [os.getenv("CLIENT_URL", "http://localhost:5173")]

# Stripe
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "eur")
try:
    STRIPE_AMOUNT_MULTIPLIER = int(os.getenv("STRIPE_AMOUNT_MULTIPLIER", "100"))
except ValueError:
    STRIPE_AMOUNT_MULTIPLIER = 100

# Configuration Stripe avec vérification
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# PayPal
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_ENV = os.getenv("PAYPAL_ENV", "sandbox").lower()
PAYPAL_CURRENCY = os.getenv("PAYPAL_CURRENCY", "EUR")
try:
    PAYPAL_FX_RATE = float(os.getenv("PAYPAL_FX_RATE", "655"))
except ValueError:
    PAYPAL_FX_RATE = 655.0

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app = FastAPI(title="TKB Shop API - Version Expert Corrigée")

# --- 2. CONFIGURATION CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. CONNEXION BDD ---
mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
db_name = os.getenv("MONGO_DB_NAME", "protel_shop")
client = MongoClient(mongo_uri)
db = client.get_database(db_name) # Utilisation du nom de base final

# --- 4. MODÈLES DE DONNÉES (Pydantic) ---

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

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

class OrderItem(BaseModel):
    product: str
    name: str
    quantity: int
    price: float
    image: str
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

class SiteSettings(BaseModel):
    bannerText: str

# --- 4b. OUTILS ORDERS / PRICING ---
def _coerce_items(items: list):
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
        normalized.append({"product": product_id, "quantity": quantity, "size": size})
    return normalized

def _get_products_map(item_list: list):
    ids = [ObjectId(i["product"]) for i in item_list]
    products = {str(p["_id"]): p for p in db.products.find({"_id": {"$in": ids}})}
    if len(products) != len(ids):
        raise HTTPException(400, "Produit introuvable")
    return products

def _check_stock(item_list: list, products_map: dict):
    for item in item_list:
        p = products_map.get(item["product"])
        stock = int(p.get("stock", 0) or 0)
        if stock < item["quantity"]:
            raise HTTPException(409, f"Stock insuffisant pour {p.get('name', 'Produit')}")

def _build_priced_items(item_list: list, products_map: dict):
    normalized_items = []
    total = 0.0
    for item in item_list:
        p = products_map.get(item["product"])
        price = float(p.get("price", 0) or 0)
        if price <= 0:
            raise HTTPException(400, "Prix invalide")
        image = p.get("image") or (p.get("images") or [None])[0] or ""
        name = p.get("name") or ""
        normalized_items.append({
            "product": item["product"],
            "name": name,
            "quantity": item["quantity"],
            "price": price,
            "image": image,
            "size": item.get("size", "Unique")
        })
        total += price * item["quantity"]
    return normalized_items, total

def _decrement_stock(item_list: list, strict: bool = False):
    for item in item_list:
        result = db.products.update_one(
            {"_id": ObjectId(item["product"]), "stock": {"$gte": item["quantity"]}},
            {"$inc": {"stock": -item["quantity"]}}
        )
        if strict and result.modified_count == 0:
            raise HTTPException(409, "Stock insuffisant")

def _paypal_base_url():
    return "https://api-m.paypal.com" if PAYPAL_ENV == "live" else "https://api-m.sandbox.paypal.com"

def _paypal_get_access_token():
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(500, "PayPal non configure")
    base = _paypal_base_url()
    auth = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
    data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()
    req = urllib.request.Request(f"{base}/v1/oauth2/token", data=data, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise HTTPException(502, f"PayPal token error: {e.code}")
    return payload.get("access_token")

def _paypal_fetch_order(order_id: str):
    token = _paypal_get_access_token()
    base = _paypal_base_url()
    req = urllib.request.Request(f"{base}/v2/checkout/orders/{order_id}")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise HTTPException(502, f"PayPal order error: {e.code}")

def _paypal_verify_order(order_id: str, expected_total: float):
    order = _paypal_fetch_order(order_id)
    status_value = order.get("status")
    if status_value not in ("COMPLETED", "APPROVED"):
        raise HTTPException(400, "Paiement PayPal non confirme")
    units = order.get("purchase_units") or []
    if not units:
        raise HTTPException(400, "PayPal order invalide")
    amount = units[0].get("amount", {})
    currency = amount.get("currency_code")
    try:
        value = float(amount.get("value", 0))
    except (TypeError, ValueError):
        raise HTTPException(400, "Montant PayPal invalide")

    expected = round(expected_total / PAYPAL_FX_RATE, 2)
    if currency and currency != PAYPAL_CURRENCY:
        raise HTTPException(400, "Devise PayPal invalide")
    if abs(value - expected) > 0.01:
        raise HTTPException(400, "Montant PayPal invalide")
    return order

# --- 5. DÉPENDANCES DE SÉCURITÉ ---

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Rigueur : Nettoyage du préfixe Bearer si envoyé manuellement
    token = token.replace("Bearer ", "")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    user["id"] = str(user["_id"])
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Accès administrateur requis"
        )
    return current_user

# --- 6. ROUTES AUTHENTIFICATION ---

@app.post("/api/auth/register")
def register(user: UserRegister):
    if db.users.find_one({"email": user.email}): 
        raise HTTPException(400, "Email déjà enregistré")
    db.users.insert_one({
        "name": user.name, 
        "email": user.email, 
        "password": pwd_context.hash(user.password), 
        "role": "client", 
        "createdAt": datetime.now()
    })
    return {"success": True}

@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin):
    u = db.users.find_one({"email": user.email})
    if not u or not pwd_context.verify(user.password, u["password"]):
        raise HTTPException(400, "Email ou mot de passe incorrect")
    
    access_token = create_access_token(data={"sub": u["email"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {"id": str(u["_id"]), "name": u["name"], "email": u["email"], "role": u.get("role", "client")}
    }

# --- 7. ROUTES PRODUITS ---

@app.get("/api/products")
def get_products():
    products = []
    for p in db.products.find().sort("_id", -1):
        if "createdAt" not in p and isinstance(p.get("_id"), ObjectId):
            p["createdAt"] = p["_id"].generation_time
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products

@app.get("/api/products/{id}")
def get_product(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Format d'ID invalide")
    p = db.products.find_one({"_id": ObjectId(id)})
    if not p:
        raise HTTPException(404, "Produit introuvable")
    if "createdAt" not in p and isinstance(p.get("_id"), ObjectId):
        p["createdAt"] = p["_id"].generation_time
    p["id"] = str(p["_id"])
    del p["_id"]
    return p

@app.post("/api/products")
def create_product(p: Product, admin: dict = Depends(get_current_admin)):
    product_data = p.dict(exclude={'id'})
    product_data.setdefault("createdAt", datetime.now())
    result = db.products.insert_one(product_data)
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/products/{id}")
def update_product(id: str, p: Product, admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Format d'ID invalide")
    product_data = p.dict(exclude={'id'})
    db.products.update_one({"_id": ObjectId(id)}, {"$set": product_data})
    return {"success": True}

@app.delete("/api/products/{id}")
def delete_product(id: str, admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Format d'ID invalide")
    db.products.delete_one({"_id": ObjectId(id)})
    return {"success": True}

# --- 8. ROUTES COMMANDES & PAIEMENTS ---

@app.get("/api/orders/my-orders")
async def get_my_orders(user: dict = Depends(get_current_user)):
    orders = []
    for o in db.orders.find({"userId": user["id"]}).sort("createdAt", -1):
        o["id"] = str(o["_id"])
        del o["_id"]
        orders.append(o)
    return orders

@app.get("/api/admin/orders")
def get_admin_orders(admin: dict = Depends(get_current_admin)):
    orders = []
    users_cache = {}
    for o in db.orders.find().sort("createdAt", -1):
        o["id"] = str(o["_id"])
        del o["_id"]
        user_id = o.get("userId")
        if user_id:
            if user_id not in users_cache:
                if ObjectId.is_valid(user_id):
                    users_cache[user_id] = db.users.find_one({"_id": ObjectId(user_id)})
                else:
                    users_cache[user_id] = None
            u = users_cache.get(user_id)
            if u:
                o.setdefault("userName", u.get("name"))
                o.setdefault("userEmail", u.get("email"))
        if o.get("items"):
            o.setdefault("productName", o["items"][0].get("name"))
        o.setdefault("totalPrice", o.get("totalAmount"))
        orders.append(o)
    return orders

@app.post("/api/orders")
def create_order(o: Order, user: dict = Depends(get_current_user)):
    item_list = _coerce_items(o.items)
    products_map = _get_products_map(item_list)
    _check_stock(item_list, products_map)
    normalized_items, total = _build_priced_items(item_list, products_map)

    d = o.dict()
    d["items"] = normalized_items
    d["totalAmount"] = total
    d["userId"] = user["id"]
    d["userName"] = user.get("name")
    d["userEmail"] = user.get("email")
    d["createdAt"] = datetime.now()

    payment_method = d.get("paymentMethod")
    if payment_method == "PayPal":
        payment_id = d.get("paymentId")
        if not payment_id:
            raise HTTPException(400, "paymentId manquant")
        _paypal_verify_order(payment_id, total)
        d["status"] = "Payé"
        _decrement_stock(normalized_items, strict=True)
    else:
        d["status"] = "En attente"

    result = db.orders.insert_one(d)
    # Retourner "id" permet au frontend de faire res.data.id
    return {"success": True, "id": str(result.inserted_id), "totalAmount": total}

@app.post("/api/orders/quote")
def quote_order(data: dict, user: dict = Depends(get_current_user)):
    items = data.get("items", []) if isinstance(data, dict) else []
    item_list = _coerce_items(items)
    products_map = _get_products_map(item_list)
    _check_stock(item_list, products_map)
    normalized_items, total = _build_priced_items(item_list, products_map)
    return {"totalAmount": total, "items": normalized_items}

@app.put("/api/orders/{id}/status")
def update_order_status(id: str, data: dict, admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Format d'ID invalide")
    status_value = data.get("status") if isinstance(data, dict) else None
    if not status_value:
        raise HTTPException(400, "Statut manquant")
    db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": status_value}})
    return {"success": True}

@app.post("/api/payments/create-stripe-session")
async def create_stripe_session(data: dict, user: dict = Depends(get_current_user)):
    # Vérification de la clé API avant de continuer
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Clé API Stripe non configurée au serveur")
    
    try:
        order_id = data.get("orderId")
        if not order_id or not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Order invalide")

        order = db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Commande introuvable")
        if order.get("userId") != user.get("id"):
            raise HTTPException(status_code=403, detail="Commande non autorisee")

        items = order.get("items") or []
        if not items:
            raise HTTPException(status_code=400, detail="Commande vide")

        line_items = []
        for item in items:
            unit_amount = int(round(float(item.get('price', 0)) * STRIPE_AMOUNT_MULTIPLIER))
            line_items.append({
                'price_data': {
                    'currency': STRIPE_CURRENCY,
                    'product_data': {
                        'name': item.get('name'),
                        'images': [item.get('image')] if item.get('image') else [],
                    },
                    # Stripe = unites minimales (ex: centimes si EUR)
                    'unit_amount': unit_amount,
                },
                'quantity': item.get('quantity', 1),
            })

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f"{os.getenv('CLIENT_URL', 'http://localhost:5173')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('CLIENT_URL', 'http://localhost:5173')}/cart",
            metadata={"orderId": order_id}
        )
        return {"id": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/stripe-webhook")
async def stripe_webhook(request: Request):
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Stripe webhook non configure")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Signature Stripe manquante")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        raise HTTPException(status_code=400, detail="Payload Stripe invalide")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature Stripe invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("orderId")
        if order_id and ObjectId.is_valid(order_id):
            order = db.orders.find_one({"_id": ObjectId(order_id)})
            if order and order.get("status") != "Payé":
                payment_id = session.get("payment_intent") or session.get("id")
                db.orders.update_one(
                    {"_id": ObjectId(order_id)},
                    {"$set": {"status": "Payé", "paymentId": payment_id}}
                )
                try:
                    _decrement_stock(order.get("items", []), strict=False)
                except Exception:
                    pass

    return {"received": True}


# --- 9. PARAMÈTRES & STATS ADMIN ---

@app.get("/api/settings")
def get_settings(): 
    s = db.settings.find_one({"_id": "global_settings"})
    return {"bannerText": s.get("bannerText") if s else "Bienvenue chez TKB SHOP"}

@app.post("/api/settings")
def update_settings(s: SiteSettings, admin: dict = Depends(get_current_admin)): 
    db.settings.update_one({"_id": "global_settings"}, {"$set": {"bannerText": s.bannerText}}, upsert=True)
    return {"success": True}

@app.get("/api/admin/stats")
def get_stats(admin: dict = Depends(get_current_admin)):
    total_revenue = db.orders.aggregate([
        {"$match": {"status": {"$in": ["Payé", "Livré", "Payé (Vérifié)"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ])
    rev_list = list(total_revenue)
    return {
        "revenue": rev_list[0]["total"] if rev_list else 0,
        "usersCount": db.users.count_documents({}),
        "productsCount": db.products.count_documents({}),
        "ordersCount": db.orders.count_documents({})
    }

@app.get("/api/admin/users")
def get_users(admin: dict = Depends(get_current_admin)):
    users_list = []
    for u in db.users.find():
        u["id"] = str(u["_id"])
        del u["_id"]
        if "password" in u: del u["password"]
        users_list.append(u)
    return users_list

@app.delete("/api/admin/users/{id}")
def delete_user(id: str, admin: dict = Depends(get_current_admin)): 
    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Format d'ID invalide")
    db.users.delete_one({"_id": ObjectId(id)})
    return {"success": True}
