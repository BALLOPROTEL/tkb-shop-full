Documentation du Projet : PROTEL Travel

________________________________________

Version : 1.0.0
Dernière mise à jour : 17 Décembre 2025
Auteur : Group4

________________________________________
1==> Présentation du Projet%

PROTEL Travel est une application web complète (Fullstack) de réservation de voyages et d'hébergements.
Elle permet aux utilisateurs de consulter des offres, de s'inscrire et de gérer leurs réservations.
Elle inclut également un panneau d'administration sécurisé pour gérer le contenu du site.

________________________________________
2==> Objectifs

●	Fournir une interface utilisateur fluide et moderne.
●	Gérer les utilisateurs et les réservations via une base de données performante.
●	Assurer un déploiement Cloud accessible 24h/24.

________________________________________
3==> Architecture Technique (La Stack)

Le projet repose sur une architecture moderne séparant le Frontend (visuel) du Backend (logique).

Frontend (Interface Client)

●	Technologie : React.js (Vite)
●	Langage : JavaScript (JSX)
●	Style : Tailwind CSS (Design responsive)
●	Icônes & Animation : Lucide React, Framer Motion
●	Hébergement : Vercel


Backend (Serveur API)

●	Technologie : FastAPI (Framework Python rapide)
●	Serveur : Uvicorn
●	Sécurité : Bcrypt (Hachage des mots de passe), JWT (Auth)
●	Hébergement : Render (Cloud Linux)


Base de Données

●	Technologie : MongoDB
●	Hébergement : MongoDB Atlas (Cloud)
●	Communication : PyMongo

________________________________________
4==> Fonctionnalités

Pour les Utilisateurs (Clients)

1.	Authentification : Inscription et Connexion sécurisées.
2.	Navigation : Recherche d'offres de voyage avec filtres visuels.
3.	Réservation : Possibilité de réserver un séjour (dates, nombre de personnes).
4.	Espace Personnel : Consultation de "Mes Voyages" et annulation.
5.	Profil : Affichage des informations personnelles.

Pour l'Administrateur

1.	Accès Sécurisé : Tableau de bord accessible uniquement via le rôle admin.
2.	Gestion des Offres : Ajouter, modifier ou supprimer des destinations.
3.	Gestion des Utilisateurs : Voir la liste des inscrits, supprimer un compte.
4.	Gestion des Réservations : Voir toutes les réservations, valider ou annuler.
5.	Statistiques : Vue d'ensemble du chiffre d'affaires et du nombre d'utilisateurs.

________________________________________
5==> Structure du Projet

PROTEL-TRAVEL/
├── backend/                  # LE CERVEAU (API Python)
│   ├── main.py               # Point d'entrée de l'API (Routes, DB, CORS)
│   ├── requirements.txt      # Liste des librairies Python (FastAPI, PyMongo...)
│   └── .env (non inclus)     # Variables secrètes (Mot de passe MongoDB)
│
├── src/                      # LE VISAGE (React Frontend)
│   ├── components/           # Briques visuelles réutilisables
│   │   ├── auth/             # Formulaires de connexion (AuthModal)
│   │   ├── layout/           # Barre de navigation (Navbar), Footer
│   │   └── home/             # Grille des offres, Héro
│   ├── pages/                # Pages complètes (Admin, Profil, Détails)
│   ├── App.jsx               # Chef d'orchestre des routes (Navigation)
│   └── main.jsx              # Point d'entrée React
│
├── index.html                # Fichier HTML principal
├── package.json              # Liste des librairies JS (React, Tailwind...)
├── vite.config.js            # Configuration du constructeur Vite
└── .gitignore                # Fichiers à ne pas envoyer sur GitHub

________________________________________
6==> Guide d'Installation (Local)

Pour reprendre le développement sur une nouvelle machine :
Prérequis : Avoir Node.js, Python et Git installés.
1.	Cloner le projet :
Bash
git clone https://github.com/BALLOPROTEL/Voyage.git
cd Voyage

2.	Lancer le Backend :
Bash
cd backend
python -m venv venv           # Créer un environnement virtuel
source venv/bin/activate      # Activer (Mac/Linux) ou venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn main:app --reload     # Le serveur tourne sur https://tkb-shop.onrender.com

3.	Lancer le Frontend :
Bash
# Ouvrir un nouveau terminal à la racine du projet (src)
npm install                   # Installer les dépendances
npm run dev                   # Le site tourne sur http://localhost:5173

________________________________________
7==> Guide de Déploiement (Mise en ligne)

Le projet est déployé sur deux plateformes distinctes qui communiquent entre elles.

Partie A : Backend (Sur Render.com)

Configuration :
    Root Directory : backend
    Build Command : pip install -r requirements.txt
    Start Command : uvicorn main:app --host 0.0.0.0 --port 10000
    Variables d'environnement :
    MONGO_URI : Lien de connexion MongoDB Atlas.

Note importante : La version de bcrypt est fixée à 4.0.1 pour assurer la compatibilité Linux.

Partie B : Frontend (Sur Vercel.com)

Configuration :
    Connecté au dépôt GitHub.
    Framework Preset : Vite.
Communication :
    Le code React pointe vers l'URL Render (https://protel-backend.onrender.com) pour toutes les requêtes API (fetch).

Attention : Le dossier "node_modules" est exclu via .gitignore pour éviter les erreurs de permission lors du build.

________________________________________
8==> Résolution des Problèmes Courants (FAQ)

Question : Le site affiche "Impossible de joindre le serveur" au premier chargement.
==> Réponse : C'est normal. Le serveur Render (version gratuite) se met en veille après inactivité. Il faut attendre environ 50 secondes lors de la première requête pour qu'il se réveille.

Question : Erreur CORS dans la console.
==> Réponse : Vérifier dans backend/main.py que l'URL du frontend (Vercel) est bien présente dans la liste origins ou que allow_origins=["*"] est activé.

Question : Erreur 500 lors de la connexion.
==> Réponse : Souvent lié à une erreur de mot de passe MongoDB dans les variables d'environnement Render, ou à une incompatibilité de version passlib/bcrypt.

________________________________________
Projet développé par NOUS: GROUP4 MAALSI BY SCHOOL BY BNPP - 2EME PRO 2025-2027
________________________________________
