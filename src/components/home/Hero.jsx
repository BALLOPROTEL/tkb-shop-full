import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Compass } from 'lucide-react';

const Hero = () => {
    // Configuration des animations (Framer Motion)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-white">

            {/* --- FOND DYNAMIQUE (Abstract Shapes) --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
            </div>

            {/* --- CONTENU PRINCIPAL --- */}
            <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl"
                >
                    {/* Titre Impactant */}
                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                        Évadez-vous vers <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            L'Extraordinaire
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                        Réservez des hébergements uniques, des activités inoubliables et vos transports en un seul endroit.
                    </motion.p>

                    {/* --- BARRE DE RECHERCHE "GLASS" --- */}
                    {/* Cette barre répond à l'exigence de recherche dynamique [cite: 36] */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-2 rounded-full flex flex-col md:flex-row items-center justify-between max-w-3xl mx-auto shadow-2xl"
                    >

                        {/* Input: Destination */}
                        <div className="flex items-center px-4 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10">
                            <MapPin className="text-blue-400 w-5 h-5 mr-3" />
                            <input
                                type="text"
                                placeholder="Où allez-vous ?"
                                className="bg-transparent border-none outline-none text-white placeholder-slate-400 w-full"
                            />
                        </div>

                        {/* Input: Type (Hébergement, Activité, Transport) */}
                        <div className="flex items-center px-4 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10">
                            <Compass className="text-purple-400 w-5 h-5 mr-3" />
                            <select className="bg-transparent border-none outline-none text-white w-full cursor-pointer [&>option]:text-black">
                                <option value="">Tout explorer</option>
                                <option value="accommodation">Hébergements</option>
                                <option value="activity">Activités</option>
                                <option value="transport">Transports</option>
                            </select>
                        </div>

                        {/* Input: Date (Simplifié pour l'exemple) */}
                        <div className="flex items-center px-4 py-3 w-full md:w-1/3">
                            <Calendar className="text-pink-400 w-5 h-5 mr-3" />
                            <input
                                type="text"
                                placeholder="Quand ?"
                                className="bg-transparent border-none outline-none text-white placeholder-slate-400 w-full"
                                onFocus={(e) => (e.target.type = "date")}
                            />
                        </div>

                        {/* Bouton Search */}
                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white p-4 rounded-full shadow-lg mt-2 md:mt-0 md:ml-2">
                            <Search className="w-6 h-6" />
                        </button>

                    </motion.div>
                </motion.div>

                {/* --- ELEMENTS FLOTTANTS DÉCORATIFS (Optionnel) --- */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-10 animate-bounce"
                >
                    <span className="text-slate-500 text-sm">Scroll pour découvrir nos offres</span>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;