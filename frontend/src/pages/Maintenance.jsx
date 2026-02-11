import React from 'react';
import { ShoppingBag, Hammer } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-[#fff0f5] flex flex-col items-center justify-center p-6 text-center">

            {/* Logo animé */}
            <div className="mb-8 animate-bounce">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl">
                    <ShoppingBag size={48} className="text-pink-500" />
                </div>
            </div>

            {/* Titre Luxe */}
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
                TKB<span className="text-pink-600">_SHOP</span>
            </h1>

            {/* Message de construction */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-lg w-full border border-pink-100 animate-in fade-in zoom-in duration-700">
                <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3 text-slate-800">
                    <Hammer size={24} className="text-pink-400" />
                    Boutique en préparation
                </h2>
                <p className="text-slate-500 mb-8 font-sans leading-relaxed text-sm md:text-base">
                    Nous peaufinons une expérience shopping d'exception pour vous.
                    Nos collections seront disponibles très prochainement.
                </p>

                <div className="h-1 w-24 bg-gradient-to-r from-pink-200 via-pink-500 to-pink-200 mx-auto rounded-full mb-8"></div>

                <p className="text-[10px] text-slate-400 font-sans uppercase tracking-[0.4em] font-black">
                    Lancement Officiel 2026
                </p>
            </div>

            <p className="mt-12 text-[10px] text-slate-400 uppercase tracking-widest italic">
                L'élégance demande de la patience.
            </p>
        </div>
    );
};

export default Maintenance;