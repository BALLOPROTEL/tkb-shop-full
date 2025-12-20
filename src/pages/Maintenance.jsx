import React from 'react';
import { ShoppingBag, Lock, Hammer } from 'lucide-react';

const Maintenance = ({ onBypass }) => {
    return (
        <div className="min-h-screen bg-[#fff0f5] flex flex-col items-center justify-center p-6 text-center">

            {/* Logo animé */}
            <div className="mb-8 animate-bounce">
                <div className="bg-slate-900 p-4 rounded-2xl shadow-xl">
                    <ShoppingBag size={48} className="text-pink-500" />
                </div>
            </div>

            {/* Titre Luxe */}
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
                TKB<span className="text-pink-600">_SHOP</span>
            </h1>

            {/* Message */}
            <div className="bg-white p-8 rounded-3xl shadow-lg max-w-lg w-full border border-pink-100">
                <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                    <Hammer size={24} className="text-slate-400" />
                    Site en construction
                </h2>
                <p className="text-slate-600 mb-6 font-sans leading-relaxed">
                    Nous préparons une expérience shopping unique pour vous.
                    La boutique ouvrira ses portes très prochainement.
                </p>

                <div className="h-1 w-20 bg-pink-500 mx-auto rounded-full mb-6"></div>

                <p className="text-xs text-slate-400 font-sans uppercase tracking-widest">
                    Lancement Officiel Bientôt
                </p>
            </div>

            {/* BOUTON SECRET (Pour toi uniquement) */}
            <button
                onClick={onBypass}
                className="mt-12 text-slate-300 hover:text-slate-900 text-xs font-sans flex items-center gap-2 transition-colors cursor-pointer"
            >
                <Lock size={12} />
            </button>

        </div>
    );
};

export default Maintenance;