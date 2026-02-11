import React from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

const Hero = ({ searchTerm, setSearchTerm }) => {
    return (
        <section className="relative w-full overflow-hidden bg-[#fff0f5]">
            {/* MARQUEE PUBLICITAIRE */}
            <div className="w-full bg-pink-600 py-2 border-y border-pink-700 overflow-hidden select-none">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-10 mx-10">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                                <Sparkles size={12} /> Nouvelle Collection : Abayas de Luxe
                            </span>
                            <span className="text-[10px] font-black text-pink-200 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Sparkles size={12} /> -15% AVEC LE CODE TKB2026
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 lg:px-12 py-12 md:py-20">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* GAUCHE : MESSAGE ET RECHERCHE */}
                    <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100 border border-pink-200 text-pink-600 text-[10px] font-bold uppercase tracking-widest">
                            <Sparkles size={12} /> L'Excellence au féminin
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif text-slate-900 leading-tight">
                            Sublimez votre <br />
                            <span className="italic text-pink-600">Féminité.</span>
                        </h1>

                        <p className="text-slate-500 text-sm md:text-base font-light max-w-lg leading-relaxed">
                            Découvrez notre sélection exclusive d'Abayas raffinées et d'accessoires d'exception.
                        </p>

                        <div className="relative max-w-md mx-auto lg:mx-0 group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Chercher une robe, un voile..."
                                className="w-full bg-white border-2 border-pink-100 py-4 px-12 text-sm rounded-2xl shadow-sm focus:border-pink-500 transition-all outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={20} />
                        </div>
                    </div>

                    {/* DROITE : VISUEL HERO */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative rounded-[40px] overflow-hidden border-8 border-white shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1599521568774-105d691c8206?q=80&w=1974&auto=format&fit=crop"
                                alt="Collection TKB Shop"
                                className="w-full h-full object-cover aspect-[4/5] hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-pink-100">
                                <p className="text-[10px] font-bold text-pink-600 uppercase mb-1">Coup de cœur</p>
                                <p className="text-sm font-bold text-slate-900">Abaya "Sultana" Gold</p>
                                <div className="flex items-center gap-2 mt-2 text-pink-600 text-xs font-bold">
                                    Découvrir <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 30s linear infinite; }
            `}} />
        </section>
    );
};

export default Hero;