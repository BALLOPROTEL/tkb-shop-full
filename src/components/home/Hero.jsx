import React from 'react';

const Hero = () => {
    return (
        <div className="relative h-[500px] md:h-[650px] w-full bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop')" }}>

            {/* Overlay (Voile sombre pour que le texte ressorte) */}
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative h-full container mx-auto px-6 flex flex-col justify-center items-center text-center text-white">

                <span className="uppercase tracking-[0.3em] text-xs md:text-sm mb-4 font-bold drop-shadow-md">
                    TKB_SHOP
                </span>

                <h1 className="text-5xl md:text-7xl font-serif font-medium mb-8 drop-shadow-lg">
                   Nos Collections
                </h1>

                <div className="flex flex-col md:flex-row gap-4">
                    <a href="#collection" className="bg-black text-white px-8 py-3.5 font-bold uppercase text-xs tracking-[0.15em] hover:bg-white hover:text-black transition-colors duration-300">
                        Découvrir
                    </a>
                    <a href="#nouveautes" className="bg-white text-black px-8 py-3.5 font-bold uppercase text-xs tracking-[0.15em] hover:bg-black hover:text-white transition-colors duration-300">
                        Nouveautés
                    </a>
                </div>

            </div>
        </div>
    );
};

export default Hero;