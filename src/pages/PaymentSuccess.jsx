import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full border border-slate-100">

        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle size={48} className="text-green-600" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Merci pour votre commande !</h1>
        <p className="text-slate-500 text-lg mb-8">
          Votre commande a bien été enregistrée. Nous préparons votre colis avec soin. 📦
        </p>

        <div className="space-y-4">
          <Link to="/my-orders" className="block w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/10">
            Suivre ma commande
          </Link>

          <Link to="/" className="block w-full bg-white text-slate-600 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={20} /> Retourner à la boutique
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;