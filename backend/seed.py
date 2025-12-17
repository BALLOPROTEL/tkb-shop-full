from pymongo import MongoClient

# 1. On se connecte à ton MongoDB local
try:
    client = MongoClient("mongodb://localhost:27017")
    print("✅ Connecté à MongoDB !")
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")
    exit()

# 2. On crée (ou sélectionne) la base de données
db = client.protel_travel

# 3. On vide tout pour recommencer à zéro (propre)
db.offers.delete_many({})
db.users.delete_many({})
db.reservations.delete_many({})
print("🗑️  Base de données nettoyée.")

# 4. On prépare les offres (Voyages)
offers_data = [
  {
    "title": "Villa Suspendue",
    "location": "Bali, Indonésie",
    "type": "accommodation",
    "price": 250,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800",
    "description": "Une villa incroyable au-dessus de la jungle avec piscine privée.",
    "status": "Active"
  },
  {
    "title": "Plongée Nocturne",
    "location": "Maldives",
    "type": "activity",
    "price": 85,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1544551763-46a8723ba3f9?auto=format&fit=crop&q=80&w=600",
    "description": "Explorez les fonds marins avec des guides experts.",
    "status": "Active"
  },
  {
    "title": "Jet Privé (Vol Partagé)",
    "location": "Paris -> Nice",
    "type": "transport",
    "price": 450,
    "rating": 5.0,
    "image": "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=600",
    "description": "Voyagez en classe affaires exclusive.",
    "status": "Active"
  },
  {
    "title": "Cabane dans les arbres",
    "location": "Costa Rica",
    "type": "accommodation",
    "price": 120,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1488415032361-b7e238421f1b?auto=format&fit=crop&q=80&w=600",
    "status": "Active"
  },
  {
    "title": "Safari 4x4",
    "location": "Kenya",
    "type": "transport",
    "price": 180,
    "rating": 4.6,
    "image": "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=600",
    "status": "Active"
  }
]

# 5. On insère les données
db.offers.insert_many(offers_data)
print(f"🎉 {len(offers_data)} offres ajoutées dans la base de données !")