import React from 'react';
import { Link } from 'react-router-dom';
import {
    Truck,
    ShieldCheck,
    Headphones,
    Instagram,
    Facebook,
    Mail,
    MapPin,
    Phone,
    ArrowRight,
    Sparkles
} from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white">
            {/* 1. SECTION RÉASSURANCE (Rose Poudré) */}
            <div className="bg-[#fff0f5] py-16 border-t border-pink-100">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center space-y-4 group">
                            <div className="p-4 bg-white rounded-full text-pink-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Truck size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Livraison Prestige</h3>
                            <p className="text-xs text-slate-500 font-light leading-relaxed max-w-[250px]">
                                Expédition sécurisée et suivie pour toutes vos pièces d'exception.
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-4 group">
                            <div className="p-4 bg-white rounded-full text-pink-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Paiement 100% Sécurisé</h3>
                            <p className="text-xs text-slate-500 font-light leading-relaxed max-w-[250px]">
                                Vos transactions sont protégées par les standards bancaires les plus élevés.
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-4 group">
                            <div className="p-4 bg-white rounded-full text-pink-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Headphones size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Service Conciergerie</h3>
                            <p className="text-xs text-slate-500 font-light leading-relaxed max-w-[250px]">
                                Une équipe dédiée pour vous accompagner 7j/7 dans vos choix.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CORPS DU FOOTER */}
            <div className="bg-white pt-20 pb-10 border-t border-gray-50">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                        {/* Colonne 1 : Brand Identity */}
                        <div className="space-y-6 text-center md:text-left">
                            <Link to="/" className="inline-block">
                                <span className="font-serif text-3xl tracking-tighter text-slate-900">
                                    TKB<span className="font-light italic text-pink-600">_</span>SHOP
                                </span>
                            </Link>
                            <p className="text-sm text-slate-500 font-light leading-relaxed">
                                L'adresse incontournable pour les femmes qui ne font aucun compromis entre élégance, modestie et modernité.
                            </p>
                            <div className="flex justify-center md:justify-start gap-4">
                                <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Colonne 2 : Boutique (Alignée avec ta Navbar) */}
                        <div className="text-center md:text-left">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-8">La Boutique</h4>
                            <ul className="space-y-4 text-sm text-slate-500 font-light">
                                <li><Link to="/#robe" className="hover:text-pink-600 transition-colors">Robes d'Exception</Link></li>
                                <li><Link to="/#abaya" className="hover:text-pink-600 transition-colors">Abayas de Luxe</Link></li>
                                <li><Link to="/#voile" className="hover:text-pink-600 transition-colors">Voiles & Hijabs</Link></li>
                                <li><Link to="/#chaussures" className="hover:text-pink-600 transition-colors">Chaussures Femme</Link></li>
                                <li><Link to="/#accessoires" className="hover:text-pink-600 transition-colors">Bijoux & Accessoires</Link></li>
                            </ul>
                        </div>

                        {/* Colonne 3 : Aide & Support */}
                        <div className="text-center md:text-left">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-8">Informations</h4>
                            <ul className="space-y-4 text-sm text-slate-500 font-light">
                                <li><Link to="/profile" className="hover:text-pink-600 transition-colors">Mon Compte</Link></li>
                                <li><Link to="/my-orders" className="hover:text-pink-600 transition-colors">Suivi de Commande</Link></li>
                                <li><Link to="/legal" className="hover:text-pink-600 transition-colors">Mentions Légales</Link></li>
                                <li><Link to="/shipping" className="hover:text-pink-600 transition-colors">Livraison & Retours</Link></li>
                                <li><Link to="/contact" className="hover:text-pink-600 transition-colors">Contactez-nous</Link></li>
                            </ul>
                        </div>

                        {/* Colonne 4 : Newsletter de Luxe */}
                        <div className="text-center md:text-left">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center justify-center md:justify-start gap-2">
                                <Sparkles size={14} className="text-pink-600" /> Newsletter
                            </h4>
                            <p className="text-sm text-slate-500 font-light mb-6">
                                Recevez nos invitations privées et nos nouvelles collections en avant-première.
                            </p>
                            <form className="relative group">
                                <input
                                    type="email"
                                    placeholder="Votre adresse email"
                                    className="w-full bg-pink-50/50 border-b border-pink-200 py-3 px-2 text-sm focus:border-pink-600 outline-none transition-all placeholder:text-pink-300"
                                />
                                <button className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-pink-600 hover:text-pink-800 transition-colors">
                                    <ArrowRight size={20} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3. BARRE FINALE (Copyright & Paiements) */}
                    <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            © 2026 TKB SHOP ONLINE. Création Haute Couture Numérique.
                        </p>

                        {/* Méthodes de paiement (Look épuré) */}
                        <div className="flex items-center gap-4 grayscale opacity-60">
                            <div className="text-[8px] font-bold border border-slate-300 px-2 py-0.5 rounded tracking-tighter">WAVE</div>
                            <div className="text-[8px] font-bold border border-slate-300 px-2 py-0.5 rounded tracking-tighter">OM</div>
                            <div className="text-[8px] font-bold border border-slate-300 px-2 py-0.5 rounded tracking-tighter">MOOV</div>
                            <div className="text-[8px] font-bold border border-slate-300 px-2 py-0.5 rounded tracking-tighter">VISA</div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;