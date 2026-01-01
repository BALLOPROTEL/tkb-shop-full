from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext
from datetime import datetime
import os
import httpx  # Pour les appels API vers Kkiapay

app = FastAPI()

# --- 1. CONFIGURATION ---
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CONNEXION BDD ---
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    client = MongoClient("mongodb://127.0.0.1:27017")
else:
    client = MongoClient(mongo_uri)
db = client.get_database("protel_shop")

# --- 3. OUTILS AUTH ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

# --- 4. MODÈLES DE DONNÉES ---
class UserRegister(BaseModel):
    name: str; email: str; password: str
class UserLogin(BaseModel):
    email: str; password: str

class Product(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    price: float
    oldPrice: Optional[float] = None
    stock: int = 0
    image: str = ""          
    images: List[str] = []
    description: Optional[str] = ""
    status: str = "Active"
    colors: List[str] = []

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Order(BaseModel):
    userId: str
    productId: str
    productName: str
    price: float
    quantity: int
    totalPrice: float
    address: str
    status: str = "En préparation"
    paymentId: Optional[str] = None # ID de transaction Kkiapay
    createdAt: datetime = Field(default_factory=datetime.now)

class SiteSettings(BaseModel):
    bannerText: str

# --- 5. ROUTES PRODUITS ---

@app.get("/api/products")
def get_products():
    products = []
    for p in db.products.find().sort("_id", -1):
        p["id"] = str(p["_id"]); del p["_id"]
        if "images" not in p: p["images"] = []
        if "image" not in p: p["image"] = ""
        products.append(p)
    return products

@app.get("/api/products/{id}")
def get_product(id: str):
    try:
        p = db.products.find_one({"_id": ObjectId(id)})
        if p:
            p["id"] = str(p["_id"]); del p["_id"]
            return p
        raise HTTPException(404, "Introuvable")
    except:
        raise HTTPException(404, "ID Invalide")

@app.post("/api/products")
def create_product(p: Product):
    product_data = p.dict()
    if 'id' in product_data: del product_data['id']
    result = db.products.insert_one(product_data)
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/products/{id}")
def update_product(id: str, p: Product):
    product_data = p.dict()
    if 'id' in product_data: del product_data['id']
    db.products.update_one({"_id": ObjectId(id)}, {"$set": product_data})
    return {"success": True}

@app.delete("/api/products/{id}")
def delete_product(id: str):
    db.products.delete_one({"_id": ObjectId(id)})
    return {"success": True}

# --- 6. ROUTES AUTHENTIFICATION ---

@app.post("/api/auth/register")
def register(user: UserRegister):
    if db.users.find_one({"email": user.email}): raise HTTPException(400, "Email pris")
    db.users.insert_one({
        "name": user.name, 
        "email": user.email, 
        "password": get_password_hash(user.password), 
        "role": "client", 
        "isVerified": True, 
        "createdAt": datetime.now()
    })
    return {"success": True}

@app.post("/api/auth/login")
def login(user: UserLogin):
    u = db.users.find_one({"email": user.email})
    if not u or not verify_password(user.password, u["password"]): raise HTTPException(400, "Erreur login")
    u["id"] = str(u["_id"]); del u["_id"]; del u["password"]
    return {"success": True, "user": u}

# --- 7. ROUTES COMMANDES & PAIEMENTS ---

@app.get("/api/admin/orders")
def get_orders():
    orders = []
    for o in db.orders.find().sort("createdAt", -1):
        o["id"] = str(o["_id"]); del o["_id"]
        orders.append(o)
    return orders

@app.post("/api/orders")
def create_order(o: Order):
    d = o.dict()
    d["createdAt"] = datetime.now()
    db.orders.insert_one(d)
    return {"success": True}

@app.put("/api/orders/{id}/status")
def update_order_status(id: str, data: dict):
    # Permet à l'admin de passer de "En préparation" à "Livré"
    db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": data["status"]}})
    return {"success": True}

@app.post("/api/payments/verify")
async def verify_kkiapay_payment(transaction_id: str):
    """
    Route de sécurité pour vérifier que le paiement a bien été encaissé
    chez Kkiapay avant de valider définitivement en BDD.
    """
    # NOTE: Les clés seront ajoutées à l'étape suivante
    KKIAPAY_SECRET_KEY = os.getenv("KKIAPAY_SECRET_KEY", "VOTRE_CLE_SECRETE_ICI")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.kkiapay.me/api/v1/transactions/verify",
            json={"transactionId": transaction_id},
            headers={"x-api-key": KKIAPAY_SECRET_KEY}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "SUCCESS":
                # On peut mettre à jour la commande ici
                db.orders.update_one(
                    {"paymentId": transaction_id},
                    {"$set": {"status": "Payé (Vérifié)"}}
                )
                return {"success": True, "details": data}
                
    raise HTTPException(400, "Échec de la vérification du paiement")

# --- 8. PARAMÈTRES & STATS ---

@app.get("/api/settings")
def get_set(): 
    s = db.settings.find_one({"_id": "global_settings"})
    return {"bannerText": s.get("bannerText") if s else "Bienvenue"}

@app.post("/api/settings")
def up_set(s: SiteSettings): 
    db.settings.update_one({"_id": "global_settings"}, {"$set": {"bannerText": s.bannerText}}, upsert=True)
    return {"success": True}

@app.get("/api/admin/stats")
def stats():
    # Calcul simple pour le dashboard
    total_revenue = db.orders.aggregate([
        {"$match": {"status": {"$regex": "Payé"}}},
        {"$group": {"_id": None, "total": {"$sum": "$totalPrice"}}}
    ])
    rev_list = list(total_revenue)
    revenue = rev_list[0]["total"] if rev_list else 0
    
    return {
        "revenue": revenue,
        "usersCount": db.users.count_documents({}),
        "productsCount": db.products.count_documents({}),
        "ordersCount": db.orders.count_documents({})
    }

@app.get("/api/admin/users")
def users():
    users_list = []
    for u in db.users.find():
        u["id"] = str(u["_id"]); del u["_id"]; del u["password"]
        users_list.append(u)
    return users_list

@app.delete("/api/admin/users/{id}")
def del_user(id: str): 
    db.users.delete_one({"_id": ObjectId(id)})
    return {"success": True}