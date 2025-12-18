import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// --- IMPORTS DES COMPOSANTS ---
import Navbar from './components/layout/Navbar';
import AuthModal from './components/auth/AuthModal';
import Footer from './components/layout/Footer';

// --- IMPORTS DES PAGES CLIENT ---
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import PaymentSuccess from './pages/PaymentSuccess';
import MyOrders from './pages/MyOrders';
import UserProfile from './pages/UserProfile';
import { CartProvider } from './context/CartContext';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';


// --- IMPORTS DES PAGES ADMIN ---
import DashboardHome from './pages/admin/DashboardHome';
// 👇 C'EST ICI QUE ÇA SE JOUE : On importe le bon fichier
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';

// Vérifie que tu as bien 'bg-slate-50' ou 'bg-white' et 'relative' et 'z-10'
const ClientLayout = ({ children, onOpenAuth }) => (
  <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col relative z-10">
    <Navbar onOpenAuth={onOpenAuth} />
    <div className="flex-grow">
      {children}
    </div>
    {/* Ajoute le Footer ici */}
    <Footer />
  </div>
);

// Vigile Admin
const AdminRoute = ({ children }) => {
  const userStored = localStorage.getItem('user');
  const user = userStored ? JSON.parse(userStored) : null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <Router>
      <CartProvider>
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#1e293b', color: '#fff' } }} />

        <Routes>
          {/* === ROUTES ADMIN === */}
          <Route path="/admin" element={<AdminRoute><DashboardHome /></AdminRoute>} />

          {/* 👇 LA ROUTE QUI MANQUAIT ! */}
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />

          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />


          {/* === ROUTES CLIENT === */}
          <Route path="/cart" element={
            <ClientLayout onOpenAuth={handleOpenAuth}>
              <Cart />
            </ClientLayout>
          } />
          <Route path="/checkout" element={
            <ClientLayout onOpenAuth={handleOpenAuth}>
              <Checkout />
            </ClientLayout>
          } />
          <Route path="/" element={<ClientLayout onOpenAuth={handleOpenAuth}><Home /></ClientLayout>} />
          <Route path="/products/:id" element={
            <ClientLayout onOpenAuth={handleOpenAuth}>
              <ProductDetails />
            </ClientLayout>
          } />
          <Route path="/my-orders" element={
            <ClientLayout onOpenAuth={handleOpenAuth}>
              <MyOrders />
            </ClientLayout>
          } />
          <Route path="/profile" element={<ClientLayout onOpenAuth={handleOpenAuth}><UserProfile /></ClientLayout>} />
          <Route path="/payment-success" element={<ClientLayout onOpenAuth={handleOpenAuth}><PaymentSuccess /></ClientLayout>} />
        </Routes>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />
      </CartProvider>
    </Router>
  );
}

export default App;