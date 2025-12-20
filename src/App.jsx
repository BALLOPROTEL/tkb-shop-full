import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import AuthModal from './components/auth/AuthModal';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

// Import de la page Maintenance
import Maintenance from './pages/Maintenance';

// --- CONFIGURATION ---
// Mets "true" pour activer la maintenance, "false" pour ouvrir au public
const IS_MAINTENANCE_MODE = true;

const AppContent = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isMaintenance, setIsMaintenance] = useState(IS_MAINTENANCE_MODE);
  const location = useLocation();

  // Vérifier si l'utilisateur a déjà le "Pass VIP" (stocké dans le navigateur)
  useEffect(() => {
    const hasBypass = localStorage.getItem('maintenance_bypass');
    if (hasBypass) {
      setIsMaintenance(false);
    }
  }, []);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Fonction pour débloquer le site (quand tu cliques sur le bouton secret)
  const unlockSite = () => {
    localStorage.setItem('maintenance_bypass', 'true');
    setIsMaintenance(false);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  // SI MAINTENANCE ACTIVÉE ET PAS DE PASS VIP -> AFFICHER MAINTENANCE
  if (isMaintenance) {
    return <Maintenance onBypass={unlockSite} />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-900">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {!isAdminRoute && <Navbar onOpenAuth={openAuth} />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      <main className="flex-grow">
        <Routes>
          {/* CLIENT */}
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminLayout><DashboardHome /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
};

export default App;