import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti'; // Si tu n'as pas cette lib, ça ne plantera pas, l'effet sera juste absent

const PaymentSuccess = () => {
  const { clearCart } = useCart();

  useEffect(() => {
    // 1. Vider le panier car c'est payé
    clearCart();

    // 2. Lancer des confettis (Effet Wow)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Poussière d'étoiles
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

  }, []); // [] = S'exécute une seule fois au chargement

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-24">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">

        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600 w-12 h-12" />
        </div>

        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Paiement Réussi !</h1>
        <p className="text-slate-500 mb-8">Merci pour votre commande. Nous la préparons avec soin.</p>

        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Package className="text-pink-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Statut</p>
              <p className="font-bold text-slate-900">En préparation</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/my-orders" className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
            <Package size={20} />
            Suivre ma commande
          </Link>

          <Link to="/" className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-100 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            <ShoppingBag size={20} />
            Continuer mes achats
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;