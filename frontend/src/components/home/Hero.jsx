import React from 'react';
import { Search } from 'lucide-react';

const Hero = ({ searchTerm, setSearchTerm, onSearch }) => {
    return (
        <div className="relative h-[550px] md:h-[700px] w-full bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop')" }}>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

            <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center text-white">

                <span className="uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-sm mb-4 font-bold drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    TKB_SHOP • MODE & ACCESSOIRES
                </span>

                {/* Correction : Taille responsive pour mobile (text-3xl) */}
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-medium mb-6 md:mb-8 drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-tight">
                    Nos Collections
                </h1>

                <p className="text-slate-200 max-w-lg mb-10 text-sm md:text-lg font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 px-2">
                    L'élégance à portée de main. Trouvez votre style unique aujourd'hui.
                </p>

                <div className="relative w-full max-w-md md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-2">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            onSearch();
                        }}
                        className="w-full py-3 md:py-4 pl-6 pr-14 rounded-full bg-white/95 text-slate-900 placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-pink-500/50 transition-all shadow-2xl text-base md:text-lg"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900 rounded-full text-white hover:bg-pink-600 transition-colors">
                        <Search size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Hero;