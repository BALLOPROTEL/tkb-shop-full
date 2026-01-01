import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#000000', '#db2777', '#d4af37']
    });
  }, []);

  return (
    <div className="min-h-screen bg-white pt-40 flex flex-col items-center px-6">
      <div className="w-16 h-16 border border-slate-200 rounded-full flex items-center justify-center mb-10">
        <Check size={30} strokeWidth={1} />
      </div>

      <h1 className="text-4xl mb-6 tracking-[0.25em] text-center uppercase">Commande Confirmée</h1>

      <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mb-16 text-center leading-loose">
        Votre transaction a été traitée avec succès. <br />
        L'élégance TKB arrive bientôt chez vous.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <button
          onClick={() => navigate('/my-orders')}
          className="flex-1 bg-black text-white py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
        >
          Mes Commandes
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 border border-black text-black py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          Accueil <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;