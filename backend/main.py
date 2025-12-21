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

# --- 1. SÉCURITÉ CORS (RESTREINTE) ---
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

# --- 2. CONFIGURATION EMAIL (SÉCURISÉE) ---
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

# Configuration pour Gmail (Port 465 SSL avec Timeout augmenté)
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_USERNAME,
    MAIL_PORT=465,              
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=False,        
    MAIL_SSL_TLS=True,          
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TIMEOUT=30 # Timeout 30 secondes
)

# --- 3. CONNEXION DB ---
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    client = MongoClient("mongodb://127.0.0.1:27017")
else:
    client = MongoClient(mongo_uri)

db = client.get_database("protel_shop")

# --- 4. SÉCURITÉ & HASHAGE ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- 5. MODÈLES DE DONNÉES ---
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

# --- 6. ROUTES AUTHENTIFICATION (ROBUSTE) ---

@app.post("/api/auth/register")
async def register(user: UserRegister): 
    # A. Vérifier si user existe
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # B. Générer Code
    otp_code = str(random.randint(100000, 999999))

    # C. Préparer Email
    message = MessageSchema(
        subject="Code de vérification TKB SHOP",
        recipients=[user.email],
        body=f"Votre code est : <strong>{otp_code}</strong>",
        subtype=MessageType.html
    )

    # D. TENTATIVE D'ENVOI (MODE ROBUSTE)
    fm = FastMail(conf)
    email_sent = False
    
    try:
        await fm.send_message(message)
        email_sent = True
    except Exception as e:
        # SI L'EMAIL PLANTE, ON LOGGUE LE CODE SECRET POUR L'ADMIN
        print(f"⚠️ ÉCHEC ENVOI EMAIL : {e}")
        print(f"🔑 CODE SECRET DE SECOURS (À COPIER) : {otp_code}") 
        print(f"🔑 CODE SECRET DE SECOURS (À COPIER) : {otp_code}")
        # On continue l'inscription quand même !

    # E. Sauvegarder l'utilisateur
    hashed_pw = get_password_hash(user.password)
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "role": "client",
        "isVerified": False,
        "otpCode": otp_code,
        "createdAt": datetime.now()
    }
    db.users.insert_one(user_dict)

    if email_sent:
        return {"success": True, "message": "Code envoyé par email !"}
    else:
        # Message discret pour l'utilisateur, mais l'inscription a marché
        return {"success": True, "message": "Compte créé. Vérifiez vos emails (ou contactez le support)."}

@app.post("/api/auth/verify")
async def verify_account(data: VerifyOTP):
    user = db.users.find_one({"email": data.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    if user.get("isVerified"):
        return {"success": True, "message": "Déjà vérifié", "user": _format_user(user)}

    if user.get("otpCode") == data.otp:
        # Code BON : On valide le compte
        db.users.update_one({"email": data.email}, {"$set": {"isVerified": True, "otpCode": None}})
        return {"success": True, "user": _format_user(user)}
    else:
        raise HTTPException(status_code=400, detail="Code incorrect !")

@app.post("/api/auth/login")
def login(user: UserLogin):
    db_user = db.users.find_one({"email": user.email})
    
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")
    
    # Bloquer si le compte n'est pas vérifié
    if db_user.get("isVerified") == False:
         raise HTTPException(status_code=400, detail="Compte non vérifié. Entrez le code reçu.")

    return {"success": True, "user": _format_user(db_user)}

# Helper pour formater l'user avant envoi (supprime mdp)
def _format_user(user_data):
    user_data["id"] = str(user_data["_id"])
    del user_data["_id"]
    if "password" in user_data: del user_data["password"]
    if "otpCode" in user_data: del user_data["otpCode"]
    return user_data

# --- 7. ROUTES PRODUITS ---

@app.get("/api/products")
def get_products():
    products = []
    for p in db.products.find():
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products

@app.get("/api/products/{id}")
def get_product(id: str):
    try:
        p = db.products.find_one({"_id": ObjectId(id)})
        if p:
            p["id"] = str(p["_id"])
            del p["_id"]
            return p
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    except:
        raise HTTPException(status_code=404, detail="ID Invalide")

@app.post("/api/products")
def create_product(p: Product):
    p_dict = p.dict()
    result = db.products.insert_one(p_dict)
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/products/{id}")
def update_product(id: str, p: Product):
    updated_data = p.dict(exclude_unset=True)
    db.products.update_one({"_id": ObjectId(id)}, {"$set": updated_data})
    return {"success": True}

@app.delete("/api/products/{id}")
def delete_product(id: str):
    db.products.delete_one({"_id": ObjectId(id)})
    return {"success": True}

# --- 8. ROUTES COMMANDES (ORDERS) ---
@app.get("/api/admin/orders")
def get_all_orders():
    orders = []
    # On récupère les commandes du plus récent au plus vieux
    for o in db.orders.find().sort("createdAt", -1):
        o["id"] = str(o["_id"])
        del o["_id"]
        # On essaie de récupérer le nom du client
        try:
            user = db.users.find_one({"_id": ObjectId(o["userId"])})
            o["userName"] = user["name"] if user else "Inconnu"
        except:
            o["userName"] = "Client supprimé"
        orders.append(o)
    return orders

@app.post("/api/orders")
def create_order(o: Order):
    o_dict = o.dict()
    result = db.orders.insert_one(o_dict)
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/orders/{id}/status")
def update_order_status(id: str, status: dict):
    # status attendu : {"status": "Livré"}
    db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": status["status"]}})
    return {"success": True}

# --- 9. ROUTES SETTINGS (Bannière Pub) ---
@app.get("/api/settings")
def get_settings():
    settings = db.settings.find_one({"_id": "global_settings"})
    if not settings:
        return {"bannerText": "Bienvenue sur TKB SHOP !"}
    return {"bannerText": settings.get("bannerText")}

@app.post("/api/settings")
def update_settings(s: SiteSettings):
    db.settings.update_one(
        {"_id": "global_settings"}, 
        {"$set": {"bannerText": s.bannerText}}, 
        upsert=True
    )
    return {"success": True}

# --- 10. ROUTES ADMIN (STATS & USERS) ---
@app.get("/api/admin/stats")
def get_stats():
    # Calcul revenu total (somme des commandes payées ou livrées)
    pipeline = [
        {"$match": {"status": {"$in": ["Livré", "Payé", "En préparation"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$totalPrice"}}}
    ]
    revenue_data = list(db.orders.aggregate(pipeline))
    revenue = revenue_data[0]["total"] if revenue_data else 0

    return {
        "revenue": revenue, 
        "usersCount": db.users.count_documents({}), 
        "productsCount": db.products.count_documents({}),
        "ordersCount": db.orders.count_documents({})
    }

@app.get("/api/admin/users")
def get_users():
    users = []
    for u in db.users.find():
        u["id"] = str(u["_id"])
        del u["_id"]
        if "password" in u: del u["password"]
        users.append(u)
    return users

@app.delete("/api/admin/users/{id}")
def delete_user(id: str):
    db.users.delete_one({"_id": ObjectId(id)})
    return {"success": True}