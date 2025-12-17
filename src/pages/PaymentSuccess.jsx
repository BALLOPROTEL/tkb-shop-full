import React, { useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Home, Calendar, MapPin, Download, User } from 'lucide-react';

const PaymentSuccess = () => {
  const location = useLocation();
  // On récupère les données envoyées depuis OfferDetails
  const bookingData = location.state;

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  // Si l'utilisateur arrive ici sans réserver (par l'URL directe), on le renvoie à l'accueil
  if (!bookingData) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }}
        className="max-w-lg w-full"
      >
        {/* Message Succès */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Paiement Validé !</h1>
          <p className="text-slate-500">Votre réservation <span className="font-mono font-bold">#{bookingData.id.slice(-6).toUpperCase()}</span> est confirmée.</p>
        </div>

        {/* Ticket Dynamique */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">
          <div className="h-32 bg-slate-900 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
            <span className="relative z-10 text-white text-2xl font-bold tracking-widest border-2 border-white/30 px-4 py-2 rounded">BOARDING PASS</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Destination</p>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-blue-500" size={20} /> {bookingData.location}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Offre</p>
                <p className="text-slate-900 font-medium">{bookingData.title}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dates</p>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Calendar size={16} className="text-purple-500" />
                  <span>{bookingData.dateStart} <span className="text-slate-300">/</span> {bookingData.dateEnd}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Voyageurs</p>
                <p className="text-slate-900 font-medium flex items-center justify-end gap-1"><User size={16} /> {bookingData.guests}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100 border-dashed">
              <span className="text-slate-500 font-medium">Total payé</span>
              <span className="text-xl font-bold text-slate-900">{bookingData.price}€</span>
            </div>
          </div>

          <div className="bg-slate-50 p-6 flex gap-4">
            <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <Download size={18} /> PDF
            </button>
            <Link to="/" className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <Home size={18} /> Accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;