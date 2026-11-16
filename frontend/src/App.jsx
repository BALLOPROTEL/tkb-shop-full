import React from 'react';
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

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { user, token } = getStoredAuth();
  if (!token || !user) return <Navigate to="/" replace />;
  if (isAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
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
          <ScrollToTop />
          <AppContent />
        </CartProvider>
      </FavoritesProvider>
    </Router>
  );
}

export default App;
