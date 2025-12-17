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

# --- SÉCURITÉ CORS (CRUCIAL) ---
# On autorise tout le monde pour éviter les erreurs "Network Error"
# Une fois que tout marche, on pourra restreindre si tu veux.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONNEXION BASE DE DONNÉES ---
# Le code cherche d'abord la variable "MONGO_URI" (sur Render)
# Sinon, il utilise le lien local (sur ton PC)
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    # Si pas de variable (donc on est sur ton PC), on met localhost
    print("⚠️ Mode LOCAL détecté")
    client = MongoClient("mongodb://localhost:27017")
else:
    # Si variable trouvée (on est sur Render), on se connecte au Cloud
    print("✅ Mode CLOUD détecté (Atlas)")
    # tlsAllowInvalidCertificates=True aide parfois à éviter les erreurs SSL
    client = MongoClient(mongo_uri, tls=True, tlsAllowInvalidCertificates=True)

db = client.protel_travel

# --- MODÈLES ET OUTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_id(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class OfferModel(BaseModel):
    title: str
    location: str
    type: str
    price: float
    rating: float = 4.5
    image: str
    description: Optional[str] = ""
    status: str = "Active"

class BookingCreate(BaseModel):
    userId: str
    offerId: str
    offerTitle: str
    location: str
    price: float
    dateStart: str
    dateEnd: str
    guests: int

class BookingUpdate(BaseModel):
    dateStart: str
    dateEnd: str
    guests: int

class BookingStatus(BaseModel):
    status: str

# --- ROUTES ---

@app.get("/")
def home():
    return {"message": "API PROTEL EN LIGNE 🚀"}

# AUTH
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

# OFFRES
@app.get("/api/offers")
def get_offers():
    return [fix_id(o) for o in db.offers.find()]

@app.get("/api/offers/{id}")
def get_offer(id: str):
    o = db.offers.find_one({"_id": ObjectId(id)})
    if o: return fix_id(o)
    raise HTTPException(404, "Offre introuvable")

@app.post("/api/offers")
def create_offer(o: OfferModel):
    res = db.offers.insert_one(o.dict())
    return {"success": True, "id": str(res.inserted_id)}

@app.put("/api/offers/{id}")
def update_offer(id: str, o: OfferModel):
    db.offers.update_one({"_id": ObjectId(id)}, {"$set": o.dict()})
    return {"success": True}

@app.delete("/api/offers/{id}")
def delete_offer(id: str):
    db.offers.delete_one({"_id": ObjectId(id)})
    return {"success": True}

# BOOKINGS
@app.post("/api/bookings")
def create_booking(b: BookingCreate):
    data = b.dict()
    data.update({"status": "confirmed", "createdAt": datetime.now()})
    res = db.reservations.insert_one(data)
    return {"success": True, "id": str(res.inserted_id)}

@app.get("/api/bookings/my")
def my_bookings(userId: str):
    return [fix_id(b) for b in db.reservations.find({"userId": userId})]

@app.put("/api/bookings/{id}")
def update_booking(id: str, b: BookingUpdate):
    db.reservations.update_one({"_id": ObjectId(id)}, {"$set": {"dateStart": b.dateStart, "dateEnd": b.dateEnd, "guests": b.guests}})
    return {"success": True}

@app.delete("/api/bookings/{id}")
def cancel_booking(id: str):
    db.reservations.update_one({"_id": ObjectId(id)}, {"$set": {"status": "cancelled"}})
    return {"success": True}

# ADMIN
@app.get("/api/admin/users")
def get_users():
    return [fix_id(u) for u in db.users.find({}, {"password": 0})]

@app.delete("/api/admin/users/{id}")
def del_user(id: str):
    db.users.delete_one({"_id": ObjectId(id)})
    return {"success": True}

@app.get("/api/admin/bookings")
def all_bookings():
    res = []
    for b in db.reservations.find():
        u = db.users.find_one({"_id": ObjectId(b["userId"])})
        b["userName"] = u["name"] if u else "Inconnu"
        res.append(fix_id(b))
    return res

@app.put("/api/bookings/{id}/status")
def set_status(id: str, s: BookingStatus):
    db.reservations.update_one({"_id": ObjectId(id)}, {"$set": {"status": s.status}})
    return {"success": True}

@app.delete("/api/admin/bookings/{id}")
def del_booking(id: str):
    db.reservations.delete_one({"_id": ObjectId(id)})
    return {"success": True}

@app.get("/api/admin/stats")
def stats():
    return {
        "revenue": sum(b.get("price", 0) for b in db.reservations.find()),
        "usersCount": db.users.count_documents({}),
        "bookingsCount": db.reservations.count_documents({})
    }