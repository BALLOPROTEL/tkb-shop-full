from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi.security import OAuth2PasswordBearer
import os
import random
from datetime import datetime

app = FastAPI()

# --- 1. SÉCURITÉ CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://tkb-shop-full.vercel.app",
    "https://tkb-shop-full.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CONFIGURATION EMAIL (BREVO / SMTP) ---
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_SERVER = "smtp-relay.brevo.com" # Serveur Brevo
MAIL_PORT = 587

if not MAIL_USERNAME or not MAIL_PASSWORD:
    print("⚠️ ATTENTION : Variables email manquantes sur Render")

conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM="no-reply@tkb-shop.com", # Tu peux mettre ce que tu veux ici
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=True,  # Brevo utilise STARTTLS sur le port 587
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

# --- 3. CONNEXION DB ---
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    client = MongoClient("mongodb://127.0.0.1:27017")
else:
    client = MongoClient(mongo_uri)

db = client.get_database("protel_shop")

# --- 4. SÉCURITÉ ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- 5. MODÈLES ---
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

# Reste des modèles (Product, Order...) inchangés, je les abrège pour la clarté
class Product(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    price: float
    oldPrice: Optional[float] = None
    stock: int
    image: str
    description: Optional[str] = None
    status: str = "Active"
    colors: List[str] = []

class Order(BaseModel):
    userId: str
    productId: str
    productName: str
    price: float
    quantity: int
    totalPrice: float
    address: str
    status: str = "En préparation"
    paymentId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)

class SiteSettings(BaseModel):
    bannerText: str

# --- 6. ROUTES AUTHENTIFICATION (LE VRAI SYSTÈME) ---

@app.post("/api/auth/register")
async def register(user: UserRegister):
    # 1. Vérifier si l'email existe
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # 2. Générer Code
    otp_code = str(random.randint(100000, 999999))

    # 3. Préparer Email
    message = MessageSchema(
        subject="Code de validation TKB SHOP",
        recipients=[user.email],
        body=f"""
        <h1>Bienvenue chez TKB SHOP !</h1>
        <p>Votre code de vérification est :</p>
        <h2 style='color: #db2777;'>{otp_code}</h2>
        <p>Ce code expire dans 10 minutes.</p>
        """,
        subtype=MessageType.html
    )

    # 4. Envoyer via Brevo
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"ERREUR EMAIL: {e}")
        # Cette fois, si Brevo échoue, c'est grave. On prévient l'user.
        raise HTTPException(status_code=500, detail="Erreur d'envoi d'email. Vérifiez votre adresse.")

    # 5. Sauvegarder User (Non vérifié)
    hashed_pw = get_password_hash(user.password)
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "role": "client",
        "isVerified": False, # On bloque tant que pas validé
        "otpCode": otp_code,
        "createdAt": datetime.now()
    }
    db.users.insert_one(user_dict)

    return {"success": True, "message": "Code envoyé ! Vérifiez vos emails."}

@app.post("/api/auth/verify")
async def verify_account(data: VerifyOTP):
    user = db.users.find_one({"email": data.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    if user.get("isVerified"):
        return {"success": True, "message": "Compte déjà vérifié", "user": _format_user(user)}

    if user.get("otpCode") == data.otp:
        db.users.update_one({"email": data.email}, {"$set": {"isVerified": True, "otpCode": None}})
        return {"success": True, "user": _format_user(user)}
    else:
        raise HTTPException(status_code=400, detail="Code incorrect !")

@app.post("/api/auth/login")
def login(user: UserLogin):
    db_user = db.users.find_one({"email": user.email})
    
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")
    
    if db_user.get("isVerified") == False:
         raise HTTPException(status_code=400, detail="Compte non vérifié. Regardez vos emails.")

    return {"success": True, "user": _format_user(db_user)}

# Helper
def _format_user(user_data):
    user_data["id"] = str(user_data["_id"])
    del user_data["_id"]
    if "password" in user_data: del user_data["password"]
    if "otpCode" in user_data: del user_data["otpCode"]
    return user_data

# --- ROUTES CLASSIQUES (PRODUITS, ETC) ---
# Je remets les routes de base pour que le fichier soit complet
@app.get("/api/products")
def get_products():
    products = []
    for p in db.products.find():
        p["id"] = str(p["_id"]); del p["_id"]; products.append(p)
    return products

@app.get("/api/products/{id}")
def get_product(id: str):
    try:
        p = db.products.find_one({"_id": ObjectId(id)})
        if p: p["id"] = str(p["_id"]); del p["_id"]; return p
        raise HTTPException(404)
    except: raise HTTPException(404)

@app.post("/api/products")
def create_product(p: Product):
    result = db.products.insert_one(p.dict())
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/products/{id}")
def update_product(id: str, p: Product):
    db.products.update_one({"_id": ObjectId(id)}, {"$set": p.dict(exclude_unset=True)})
    return {"success": True}

@app.delete("/api/products/{id}")
def delete_product(id: str):
    db.products.delete_one({"_id": ObjectId(id)})
    return {"success": True}

@app.get("/api/admin/orders")
def get_orders():
    orders = []
    for o in db.orders.find().sort("createdAt", -1):
        o["id"] = str(o["_id"]); del o["_id"]
        try:
            u = db.users.find_one({"_id": ObjectId(o["userId"])})
            o["userName"] = u["name"] if u else "Inconnu"
        except: o["userName"] = "Inconnu"
        orders.append(o)
    return orders

@app.post("/api/orders")
def create_order(o: Order):
    result = db.orders.insert_one(o.dict())
    return {"success": True}

@app.put("/api/orders/{id}/status")
def update_status(id: str, status: dict):
    db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": status["status"]}})
    return {"success": True}

@app.get("/api/settings")
def get_set():
    s = db.settings.find_one({"_id": "global_settings"})
    return {"bannerText": s.get("bannerText") if s else "Bienvenue !"}

@app.post("/api/settings")
def up_set(s: SiteSettings):
    db.settings.update_one({"_id": "global_settings"}, {"$set": {"bannerText": s.bannerText}}, upsert=True)
    return {"success": True}

@app.get("/api/admin/stats")
def stats():
    return {"revenue": 0, "usersCount": 0} # Simplifié pour l'exemple

@app.get("/api/admin/users")
def users():
    return []

@app.delete("/api/admin/users/{id}")
def del_user(id: str):
    db.users.delete_one({"_id": ObjectId(id)})
    return {"success": True}