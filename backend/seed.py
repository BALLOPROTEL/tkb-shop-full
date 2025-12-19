from pymongo import MongoClient

# 1. Connexion au MongoDB Local
try:
    client = MongoClient("mongodb://localhost:27017")
    print("✅ Connecté au PC Local (MongoDB) !")
except Exception as e:
    print(f"❌ Erreur : {e}")
    exit()

# 2. Sélection de la base E-COMMERCE
db = client.protel_shop

# 3. Nettoyage (On vide les produits et commandes, mais on garde les users si tu veux)
db.products.delete_many({})
db.orders.delete_many({})
# db.users.delete_many({}) # Décommente si tu veux aussi supprimer les utilisateurs
print("🗑️  Anciens produits supprimés.")

# 4. Préparation des Produits (Mode / Sacs)
products_data = [
  {
    "name": "Sac Michael Kors Blanc",
    "category": "Sac",
    "price": 100,
    "oldPrice": 200,
    "stock": 7,
    "image": "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcR_k81JjC8Pj38jP_Gj5aX99H5-5J59595959", # Mets une vraie URL d'image valide si celle-ci casse
    "description": "Sac à main élégant pour les soirées.",
    "status": "Active",
    "colors": ["#FFFFFF", "#000000", "#D4A373"] # Blanc, Noir, Beige
  },
  {
    "name": "Escarpins Rouges",
    "category": "Chaussure",
    "price": 45000,
    "oldPrice": 60000,
    "stock": 12,
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800",
    "description": "Talons hauts confortables et vernis.",
    "status": "Active",
    "colors": ["#EF4444", "#000000"] # Rouge, Noir
  },
  {
    "name": "Sac à dos Cuir",
    "category": "Sac",
    "price": 35000,
    "oldPrice": None,
    "stock": 5,
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800",
    "description": "Parfait pour le travail et les voyages.",
    "status": "Active",
    "colors": ["#78350F"] # Marron
  },
  {
    "name": "Montre Or Rose",
    "category": "Accessoire",
    "price": 15000,
    "oldPrice": 25000,
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1513116476489-76db1a780648?q=80&w=800",
    "description": "Accessoire indispensable pour briller.",
    "status": "Active",
    "colors": ["#FFD700", "#C0C0C0"] # Or, Argent
  }
]

# 5. Insertion
db.products.insert_many(products_data)
print(f"🎉 {len(products_data)} produits ajoutés dans 'protel_shop' !")