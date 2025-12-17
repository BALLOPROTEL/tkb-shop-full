import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Gestion des notifications jolies

// --- IMPORTS DES COMPOSANTS ---
import Navbar from './components/layout/Navbar';
import AuthModal from './components/auth/AuthModal';
import Hero from './components/home/Hero';
import OfferGrid from './components/home/OfferGrid';

// --- IMPORTS DES PAGES CLIENT ---
import OfferDetails from './pages/OfferDetails';
import PaymentSuccess from './pages/PaymentSuccess';
import MyBookings from './pages/MyBookings';
import UserProfile from './pages/UserProfile';

// --- IMPORTS DES PAGES ADMIN ---
import DashboardHome from './pages/admin/DashboardHome';
import AdminOffers from './pages/admin/AdminOffers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';

// Wrapper pour la mise en page Client (Navbar + Footer)
const ClientLayout = ({ children, onOpenAuth }) => (
  <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
    <Navbar onOpenAuth={onOpenAuth} />
    <div className="flex-grow">
      {children}
    </div>
    <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800">
      <p className="mb-4 text-lg font-semibold text-white">PROTEL.Travel</p>
      <p>© 2024 Projet MongoDB. Tous droits réservés.</p>
    </footer>
  </div>
);

// Page d'accueil combinée (Hero + Grille)
const Home = () => (
  <>
    <div id="explore"><Hero /></div>
    <div id="stays"><OfferGrid /></div>
  </>
);

// Composant de protection (Vigile)
const AdminRoute = ({ children }) => {
  const userStored = localStorage.getItem('user');
  const user = userStored ? JSON.parse(userStored) : null;

  // Si pas connecté OU pas admin -> Retour à la maison
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  // État pour la modale d'authentification
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'

  // Fonction pour ouvrir la modale dans le bon mode
  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <Router>
      {/* TOASTER : C'est ici qu'on configure l'affichage des bulles de notification.
          On le place en haut pour qu'il soit visible par-dessus tout.
      */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#1e293b', // Slate-800 (Sombre)
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>

        {/* =========================================
            ROUTES ADMIN (SÉCURISÉES)
           ========================================= */}
        <Route path="/admin" element={
          <AdminRoute><DashboardHome /></AdminRoute>
        } />
        <Route path="/admin/offers" element={
          <AdminRoute><AdminOffers /></AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute><AdminUsers /></AdminRoute>
        } />
        <Route path="/admin/bookings" element={
          <AdminRoute><AdminBookings /></AdminRoute>
        } />
        {/* =========================================
            ROUTES CLIENT (Avec Navbar & Footer)
           ========================================= */}

        <Route path="/" element={
          <ClientLayout onOpenAuth={handleOpenAuth}>
            <Home />
          </ClientLayout>
        } />

        <Route path="/offer/:id" element={
          <ClientLayout onOpenAuth={handleOpenAuth}>
            <OfferDetails />
          </ClientLayout>
        } />

        <Route path="/payment-success" element={
          <ClientLayout onOpenAuth={handleOpenAuth}>
            <PaymentSuccess />
          </ClientLayout>
        } />

        <Route path="/my-bookings" element={
          <ClientLayout onOpenAuth={handleOpenAuth}>
            <MyBookings />
          </ClientLayout>
        } />

        <Route path="/profile" element={
          <ClientLayout onOpenAuth={handleOpenAuth}>
            <UserProfile />
          </ClientLayout>
        } />

      </Routes>

      {/* Le Modal de Connexion est accessible partout */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </Router>
  );
}

export default App;