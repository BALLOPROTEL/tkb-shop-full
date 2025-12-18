import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext
from bson import ObjectId
from datetime import datetime
from dotenv import load_dotenv

# Charge les variables d'environnement (si en local)
load_dotenv()

app = FastAPI()

# --- SÉCURITÉ CORS ---
# On autorise tout le monde pour éviter les blocages Frontend/Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONNEXION BASE DE DONNÉES ---
# 1. Cherche la variable Render
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    # 2. Si pas de variable Render, utilise le local (PC)
    print("⚠️ Mode LOCAL détecté (PC)")
    client = MongoClient("mongodb://127.0.0.1:27017")
else:
    # 3. Si variable trouvée, utilise le Cloud (Atlas)
    print("✅ Mode CLOUD détecté (Atlas)")
    client = MongoClient(mongo_uri, tls=True, tlsAllowInvalidCertificates=True)

db = client.protel_shop  # J'ai changé le nom de la base pour "protel_shop"



# --- MODÈLE PARAMÈTRES SITE ---
class SiteSettings(BaseModel):
    bannerText: str

# --- MODÈLES ET OUTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_id(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

# --- MODÈLES UTILISATEURS ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str




# --- MODÈLE PRODUIT (MISE À JOUR) ---
class Product(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    price: float
    oldPrice: Optional[float] = None  # <--- NOUVEAU : Ancien prix (peut être vide)
    stock: int
    image: str
    description: Optional[str] = None
    status: str = "Active"
    colors: List[str] = []            # <--- NOUVEAU : Liste de couleurs (codes HEX)


# --- MODÈLES PRODUITS (Sacs, Chaussures, etc.) ---
class ProductModel(BaseModel):
    name: str           # Ex: "Sac à main Luxe"
    category: str       # Ex: "sac", "chaussure", "accessoire"
    price: float        # Ex: 45000
    oldPrice: Optional[float] = None # Pour afficher une promo (barré)
    image: str          # URL de l'image
    description: Optional[str] = ""
    rating: float = 4.5
    stock: int = 10     # Quantité disponible
    status: str = "Active"

# --- MODÈLES COMMANDES ---
class OrderCreate(BaseModel):
    userId: str
    productId: str
    productName: str
    price: float
    quantity: int       # Nombre d'articles
    totalPrice: float   # Prix x Quantité
    address: str        # Adresse de livraison

class OrderStatus(BaseModel):
    status: str         # "En attente", "Livré", "Annulé"

# --- ROUTES ---

@app.get("/")
def home():
    return {"message": "API PROTEL SHOP V1 Ready 🛍️"}

# --- AUTHENTIFICATION (Inchangé) ---
@app.post("/api/auth/register")
def register(user: UserRegister):
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    hashed = pwd_context.hash(user.password)
    res = db.users.insert_one({
        "name": user.name, "email": user.email, "password": hashed,
        "role": "client", "joinDate": datetime.now().strftime("%d %b %Y"), "status": "active"
    })
    return {"success": True, "userId": str(res.inserted_id)}

@app.post("/api/auth/login")
def login(creds: UserLogin):
    user = db.users.find_one({"email": creds.email})
    if not user or not pwd_context.verify(creds.password, user["password"]):
        return {"success": False, "message": "Identifiants incorrects"}
    return {"success": True, "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"], "role": user.get("role", "client")}}

# --- GESTION DES PRODUITS (CRUD) ---

@app.get("/api/products")
def get_products():
    # Récupère tous les produits
    return [fix_id(p) for p in db.products.find()]

@app.get("/api/products/{id}")
def get_product(id: str):
    p = db.products.find_one({"_id": ObjectId(id)})
    if p: return fix_id(p)
    raise HTTPException(404, "Produit introuvable")

@app.post("/api/products")
def create_product(p: ProductModel):
    # Ajoute un nouveau sac ou chaussure
    res = db.products.insert_one(p.dict())
    return {"success": True, "id": str(res.inserted_id)}

# Route pour modifier un produit
@app.put("/api/products/{id}")
def update_product(id: str, p: Product):  # <--- ATTENTION : Utilise "Product", pas "ProductModel"
    # On convertit les données reçues en dictionnaire
    # exclude_unset=True est important : ça évite d'effacer des champs si on ne les envoie pas
    updated_data = p.dict(exclude_unset=True)
    
    # On met à jour dans la base de données
    result = db.products.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": updated_data}
    )
    
    if result.modified_count == 1:
        return {"success": True, "message": "Produit mis à jour"}
    else:
        return {"success": False, "message": "Aucun changement ou produit introuvable"}

@app.delete("/api/products/{id}")
def delete_product(id: str):
    db.products.delete_one({"_id": ObjectId(id)})
    return {"success": True}

# --- GESTION DES COMMANDES (Panier) ---

@app.post("/api/orders")
def create_order(order: OrderCreate):
    # 1. Vérifier le stock
    product = db.products.find_one({"_id": ObjectId(order.productId)})
    if not product or product.get("stock", 0) < order.quantity:
         raise HTTPException(400, "Stock insuffisant !")

    # 2. Créer la commande
    data = order.dict()
    data.update({"status": "En préparation", "createdAt": datetime.now()})
    res = db.orders.insert_one(data)

    # 3. Mettre à jour le stock (Décrémenter)
    db.products.update_one(
        {"_id": ObjectId(order.productId)},
        {"$inc": {"stock": -order.quantity}}
    )
    
    return {"success": True, "id": str(res.inserted_id)}

@app.get("/api/orders/my")
def my_orders(userId: str):
    return [fix_id(o) for o in db.orders.find({"userId": userId})]




# --- ROUTES PARAMÈTRES (Pour la bannière pub) ---
@app.get("/api/settings")
def get_settings():
    # On cherche les réglages, s'ils n'existent pas, on en crée par défaut
    settings = db.settings.find_one({"_id": "global_settings"})
    if not settings:
        return {"bannerText": "Bienvenue sur PROTEL Shop ! Livraison offerte dès 50.000F 🚚"}
    return {"bannerText": settings.get("bannerText")}

@app.post("/api/settings")
def update_settings(s: SiteSettings):
    # On met à jour le texte (upsert=True signifie "crée si ça n'existe pas")
    db.settings.update_one(
        {"_id": "global_settings"}, 
        {"$set": {"bannerText": s.bannerText}}, 
        upsert=True
    )
    return {"success": True}

# --- ROUTES ADMIN ---

@app.get("/api/admin/users")
def get_users():
    return [fix_id(u) for u in db.users.find({}, {"password": 0})]

@app.get("/api/admin/orders")
def all_orders():
    orders = []
    for o in db.orders.find():
        # On récupère le nom du client pour l'afficher
        u = db.users.find_one({"_id": ObjectId(o["userId"])})
        o["userName"] = u["name"] if u else "Client Inconnu"
        orders.append(fix_id(o))
    return orders

@app.put("/api/orders/{id}/status")
def set_order_status(id: str, s: OrderStatus):
    # Changer le statut (ex: "Expédié")
    db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": s.status}})
    return {"success": True}

@app.get("/api/admin/stats")
def stats():
    # Calcul du chiffre d'affaires
    total_revenue = sum(o.get("totalPrice", 0) for o in db.orders.find())
    return {
        "revenue": total_revenue,
        "usersCount": db.users.count_documents({}),
        "productsCount": db.products.count_documents({}),
        "ordersCount": db.orders.count_documents({})
    }