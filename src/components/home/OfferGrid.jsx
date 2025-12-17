import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const OfferGrid = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // Connexion au Backend Python
        fetch('http://127.0.0.1:8000/api/offers')
            .then(res => res.json())
            .then(data => {
                // Ajout des tailles pour le design Bento
                const styledData = data.map((offer, index) => ({
                    ...offer,
                    size: index === 0 ? 'large' : index === 1 ? 'tall' : index === 3 ? 'wide' : 'normal'
                }));
                setOffers(styledData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur API:", err);
                setLoading(false);
            });
    }, []);

    const filteredOffers = filter === 'all'
        ? offers
        : offers.filter(item => item.type === filter);

    if (loading) return <div className="text-center py-20 text-white">Chargement...</div>;

    return (
        <section className="py-20 bg-slate-900" id="stays">
            <div className="container mx-auto px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2">Nos pépites du moment</h2>
                        <p className="text-slate-400">Explorez le monde à travers nos meilleures offres.</p>
                    </div>
                    <div className="flex gap-2 mt-6 md:mt-0 bg-slate-800 p-1 rounded-full border border-slate-700">
                        {['all', 'accommodation', 'activity', 'transport'].map((category) => (
                            <button
                                key={category}
                                onClick={() => setFilter(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === category ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {category === 'all' ? 'Tout' :
                                    category === 'accommodation' ? 'Hébergements' :
                                        category === 'activity' ? 'Activités' : 'Transports'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grille (Design Original Restoré) */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-4 auto-rows-[300px] gap-6">
                    <AnimatePresence>
                        {filteredOffers.map((offer) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={offer.id}
                                className={`
                  group relative rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow border border-slate-800 bg-slate-800
                  ${offer.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
                  ${offer.size === 'tall' ? 'md:row-span-2' : ''}
                  ${offer.size === 'wide' ? 'md:col-span-2' : ''}
                `}
                            >
                                {/* LIEN DYNAMIQUE (C'est ça qui manquait !) */}
                                <Link to={`/offer/${offer.id}`} className="block w-full h-full">

                                    {/* Image avec Zoom au survol */}
                                    <div className="absolute inset-0 w-full h-full">
                                        <img
                                            src={offer.image}
                                            alt={offer.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    </div>

                                    {/* Badge Type */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/10">
                                            {offer.type}
                                        </span>
                                    </div>

                                    {/* Contenu Bas */}
                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform z-20">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className={`font-bold leading-tight mb-1 ${offer.size === 'large' ? 'text-3xl' : 'text-xl'}`}>
                                                    {offer.title}
                                                </h3>
                                                <div className="flex items-center text-slate-300 text-sm">
                                                    <MapPin size={14} className="mr-1 text-blue-400" />
                                                    {offer.location}
                                                </div>
                                            </div>

                                            {/* Étoile Jaune (Ton design préféré) */}
                                            <div className="flex items-center bg-yellow-500 text-black px-2 py-1 rounded-lg text-sm font-bold shadow-lg">
                                                <Star size={14} className="mr-1 fill-black" />
                                                {offer.rating}
                                            </div>
                                        </div>

                                        {/* Prix et Bouton Réserver (Apparition au survol) */}
                                        <div className="flex items-center justify-between mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div>
                                                <span className="text-2xl font-bold">{offer.price}€</span>
                                                <span className="text-sm text-slate-300"> / pers</span>
                                            </div>
                                            <span className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-blue-50 transition-colors">
                                                Réserver <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </div>

                                </Link>

                                {/* Bouton Cœur */}
                                <button
                                    onClick={(e) => { e.preventDefault(); }}
                                    className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors z-30 border border-white/10"
                                >
                                    <Heart size={18} />
                                </button>

                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

            </div>
        </section>
    );
};

export default OfferGrid;