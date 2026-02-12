import React from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

const Hero = ({ searchTerm, setSearchTerm }) => {
    return (
        <section className="relative w-full overflow-hidden bg-[#0b0b0f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)] opacity-70" />
            <div className="absolute -top-24 right-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-pink-500/20 blur-3xl rounded-full animate-float-slow" />

            {/* MARQUEE PUBLICITAIRE */}
            <div className="w-full bg-black/80 py-2 border-y border-white/10 overflow-hidden select-none">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-10 mx-10">
                            <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[0.25em] sm:tracking-[0.4em] flex items-center gap-2">
                                <Sparkles size={12} /> Decouvrez vos pieces preferees
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-black text-pink-200 uppercase tracking-[0.25em] sm:tracking-[0.4em] flex items-center gap-2">
                                <Sparkles size={12} /> -15% avec le code TKB2026
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-24">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                    {/* GAUCHE : MESSAGE ET RECHERCHE */}
                    <div className="lg:col-span-5 space-y-6 sm:space-y-8 text-center lg:text-left animate-fade-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em]">
                            <Sparkles size={12} /> Nouvelle collection
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif uppercase tracking-[0.18em] leading-tight">
                            TKB SHOP
                            <span className="block text-pink-300 font-light italic tracking-normal text-2xl sm:text-3xl md:text-4xl mt-2">
                                Luxe du quotidien
                            </span>
                        </h1>

                        <p className="text-slate-200/80 text-sm sm:text-base font-light max-w-lg leading-relaxed mx-auto lg:mx-0">
                            Des silhouettes modernes, des matieres nobles et une selection precise pour sublimer
                            chaque instant.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                            <button className="bg-white text-slate-900 px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.35em] font-black hover:bg-pink-600 hover:text-white transition-all">
                                Explorer la collection
                            </button>
                            <button className="border border-white/30 text-white px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.35em] font-black hover:border-pink-400 hover:text-pink-200 transition-all">
                                Nouveautes
                            </button>
                        </div>

                        <div className="relative max-w-md mx-auto lg:mx-0 group">
                            <input
                                id="home-search"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Chercher une piece, un accessoire..."
                                className="w-full bg-white/95 text-slate-900 border-2 border-white/30 py-3 sm:py-4 px-10 sm:px-12 text-sm rounded-2xl shadow-sm focus:border-pink-400 transition-all outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={20} />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start text-[9px] uppercase tracking-[0.3em]">
                            {['Sacs', 'Chaussures', 'Abayas', 'Bijoux', 'Voiles'].map((tag) => (
                                <span key={tag} className="px-3 py-1 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-pink-400 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* DROITE : VISUELS HERO */}
                    <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl group">
                            <img
                                src="https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=1200&auto=format&fit=crop"
                                alt="Collection TKB Shop"
                                className="w-full h-full object-cover aspect-[3/4] group-hover:scale-105 transition-transform duration-[1600ms] ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-4 left-4 bg-white/90 text-slate-900 px-3 py-2 rounded-full text-[9px] uppercase tracking-[0.3em] font-black">
                                Sacs iconiques
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl group mt-10">
                            <img
                                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop"
                                alt="Nouvelle saison"
                                className="w-full h-full object-cover aspect-[3/4] group-hover:scale-105 transition-transform duration-[1600ms] ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 text-slate-900 px-3 py-2 rounded-full text-[9px] uppercase tracking-[0.3em] font-black">
                                Decouvrir <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
