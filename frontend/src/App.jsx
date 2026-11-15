import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import UserProfile from './pages/UserProfile';
import PaymentSuccess from './pages/PaymentSuccess';
import CategoryPage from './pages/CategoryPage';
import Favorites from './pages/Favorites';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminInvite from './pages/auth/AdminInvite';
import Contact from './pages/legal/Contact';
import LegalPage from './pages/legal/LegalPage';

import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import { getStoredAuth } from './utils/authStorage';
import { ensureServicesReady } from './utils/serviceBootstrap';

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { user, token } = getStoredAuth();
  if (!token || !user) return <Navigate to="/" replace />;
  if (isAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const ServiceBootstrapGate = ({ children }) => {
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');

  const start = useCallback(() => {
    setStatus('starting');
    setError('');

    ensureServicesReady()
      .then(() => setStatus('ready'))
      .catch((err) => {
        setError(err?.message || "TKB Shop n'a pas pu demarrer correctement.");
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  if (status === 'ready') {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#07080d] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-10 text-center shadow-2xl">
        <div className="text-xs font-semibold tracking-[0.45em] text-slate-400">
          TKB SHOP
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[0.12em] text-slate-900">
          {status === 'error' ? 'DEMARRAGE INTERROMPU' : 'PREPARATION DE LA BOUTIQUE'}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {status === 'error'
            ? error
            : "L'environnement de test redemarre ses services apres une periode d'inactivite. La boutique s'ouvrira automatiquement des qu'ils seront prets."}
        </p>

        {status === 'starting' ? (
          <div className="mt-7 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Initialisation
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            className="mt-7 w-full bg-slate-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
          >
            Reessayer
          </button>
        )}
      </div>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAdminPath && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin-invite" element={<AdminInvite />} />
          <Route path="/shop/:category" element={<CategoryPage />} />
          <Route path="/shop/:category/:subcategory" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentions-legales" element={<LegalPage />} />
          <Route path="/cgv" element={<LegalPage />} />
          <Route path="/confidentialite" element={<LegalPage />} />
          <Route path="/livraison-retours" element={<LegalPage />} />

          <Route path="/admin" element={<ProtectedRoute isAdmin={true}><AdminLayout><DashboardHome /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute isAdmin={true}><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute isAdmin={true}><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute isAdmin={true}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/newsletter" element={<ProtectedRoute isAdmin={true}><AdminLayout><AdminNewsletter /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <FavoritesProvider>
        <CartProvider>
          <Toaster position="top-center" />
          <ServiceBootstrapGate>
            <ScrollToTop />
            <AppContent />
          </ServiceBootstrapGate>
        </CartProvider>
      </FavoritesProvider>
    </Router>
  );
}

export default App;
