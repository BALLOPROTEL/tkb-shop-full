import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ShoppingBag, Sparkles, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [isCelebrationActive, setIsCelebrationActive] = useState(true);

  useEffect(() => {
    // 1. Nettoyage immédiat du panier après succès
    clearCart();

    // 2. Lancement de la célébration "Royal Confetti"
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsCelebrationActive(false);
        return;
      }

      const particleCount = 40 * (timeLeft / duration);

      // Animation multidirectionnelle pour un effet immersif
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-20 relative overflow-hidden">

      {/* Design Minimaliste Rose Poudré */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[30rem] h-[30rem] bg-pink-50 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-pink-100 rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="max-w-xl w-full text-center space-y-12 relative z-20 animate-in fade-in zoom-in duration-1000">

        {/* Badge de Validation */}
        <div className="relative inline-block">
          <div className="w-28 h-28 bg-pink-50 rounded-full flex items-center justify-center mx-auto border-2 border-pink-100 shadow-inner">
            <Check size={56} className="text-pink-600" strokeWidth={1} />
          </div>
          {isCelebrationActive && (
            <>
              <Sparkles className="absolute -top-3 -right-3 text-pink-400 animate-bounce" size={28} />
              <Heart className="absolute -bottom-3 -left-3 text-pink-300 animate-pulse" size={24} />
            </>
          )}
        </div>

        {/* Message de Succès */}
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2 text-pink-500">
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Paiement Confirmé</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-[1.1]">
            Votre commande est <br />
            <span className="italic text-pink-600">en chemin.</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-light max-w-sm mx-auto leading-relaxed">
            Merci de votre confiance. Notre atelier prépare vos pièces avec le plus grand soin.
          </p>
        </div>

        {/* Actions Client */}
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-10 border border-pink-50 shadow-2xl shadow-pink-100/50 space-y-8">
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-black">
            Un reçu détaillé a été envoyé à votre adresse email.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <button
              onClick={() => navigate('/my-orders')}
              className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-pink-600 transition-all duration-500 shadow-xl shadow-slate-200"
            >
              <ShoppingBag size={16} /> Suivre mes achats
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-3 border-2 border-slate-100 text-slate-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all duration-300"
            >
              Retour à l'accueil <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-300 uppercase tracking-[0.4em] font-black pt-6">
          TKB_SHOP • L'excellence au féminin
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;