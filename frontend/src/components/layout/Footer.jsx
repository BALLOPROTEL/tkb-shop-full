import React, { useState } from 'react';
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
    Sparkles,
    Crown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) {
            toast.error('Veuillez saisir un email.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/newsletter', { email: value });
            if (res.data?.already) {
                toast.success('Vous etes deja inscrit.');
            } else {
                toast.success('Merci ! Inscription enregistree.');
            }
            setEmail('');
        } catch (err) {
            toast.error("Impossible d'enregistrer votre email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className="bg-[#0b0b0f] text-white">
            {/* Bandeau de confiance */}
            <div className="bg-gradient-to-r from-[#111018] via-[#1b1424] to-[#0b0b0f] border-t border-white/5">
                <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Truck,
                                title: 'Livraison Prestige',
                                text: 'Expedition rapide, suivie et soigneusement preparee pour chaque piece.',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Paiement Securise',
                                text: 'Transactions protegees par les standards de securite internationaux.',
                            },
                            {
                                icon: Headphones,
                                title: 'Conciergerie',
                                text: 'Une equipe dediee pour vous accompagner a chaque etape.',
                            },
                            {
                                icon: Crown,
                                title: 'Selection Luxe',
                                text: 'Collections exclusives choisies pour leur elegance et leur qualite.',
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="group rounded-3xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur hover:bg-white/10 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-pink-300 mb-4 group-hover:scale-110 transition-transform">
                                    <item.icon size={22} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-2">{item.title}</h3>
                                <p className="text-xs text-white/60 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Corps du footer */}
            <div className="relative overflow-hidden">
                <div className="absolute -top-24 right-[-10%] w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-[-10%] w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr] gap-10">
                        {/* Marque */}
                        <div className="space-y-6">
                            <Link to="/" className="inline-flex items-center gap-3">
                                <span className="font-serif text-3xl tracking-tighter text-white">
                                    TKB<span className="font-light italic text-pink-400">_</span>SHOP
                                </span>
                            </Link>
                            <p className="text-sm text-white/60 leading-relaxed">
                                L'adresse incontournable pour une elegance moderne, modeste et pleine de caractere.
                            </p>
                            <div className="space-y-2 text-sm text-white/70">
                                <div className="flex items-center gap-3"><MapPin size={16} className="text-pink-300" /> Abidjan, Cote d'Ivoire</div>
                                <div className="flex items-center gap-3"><Phone size={16} className="text-pink-300" /> +225 07 00 00 00 00</div>
                                <div className="flex items-center gap-3"><Mail size={16} className="text-pink-300" /> contact@tkb-shop.com</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 hover:text-white transition-all">
                                    <Instagram size={18} />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 hover:text-white transition-all">
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Boutique */}
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90 mb-6">La boutique</h4>
                            <ul className="space-y-3 text-sm text-white/60">
                                <li><Link to="/shop/vetements/robes" className="hover:text-pink-300 transition-colors">Robes d'exception</Link></li>
                                <li><Link to="/shop/vetements/abayas" className="hover:text-pink-300 transition-colors">Abayas de luxe</Link></li>
                                <li><Link to="/shop/vetements/voiles-et-hijabs" className="hover:text-pink-300 transition-colors">Voiles & Hijabs</Link></li>
                                <li><Link to="/shop/chaussures/femme" className="hover:text-pink-300 transition-colors">Chaussures femme</Link></li>
                                <li><Link to="/shop/accessoires/colliers" className="hover:text-pink-300 transition-colors">Bijoux & accessoires</Link></li>
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90 mb-6">Services</h4>
                            <ul className="space-y-3 text-sm text-white/60">
                                <li><Link to="/profile" className="hover:text-pink-300 transition-colors">Mon compte</Link></li>
                                <li><Link to="/my-orders" className="hover:text-pink-300 transition-colors">Suivi de commande</Link></li>
                                <li><Link to="/favorites" className="hover:text-pink-300 transition-colors">Favoris</Link></li>
                                <li><Link to="/contact" className="hover:text-pink-300 transition-colors">Nous contacter</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90 flex items-center gap-2">
                                <Sparkles size={14} className="text-pink-300" /> Newsletter
                            </h4>
                            <p className="text-sm text-white/60">
                                Recevez nos invitations privees et nos nouvelles collections en avant-premiere.
                            </p>
                            <form onSubmit={handleNewsletterSubmit} className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Votre adresse email"
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-label="S'inscrire a la newsletter"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-pink-500 text-white flex items-center justify-center hover:bg-pink-400 transition-all disabled:opacity-60"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                            <div className="text-[11px] text-white/50">
                                En vous inscrivant, vous acceptez nos <Link to="/confidentialite" className="underline hover:text-pink-300">conditions</Link>.
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90 mb-4">Informations</h4>
                                <ul className="space-y-3 text-sm text-white/60">
                                    <li><Link to="/mentions-legales" className="hover:text-pink-300 transition-colors">Mentions legales</Link></li>
                                    <li><Link to="/cgv" className="hover:text-pink-300 transition-colors">Conditions generales</Link></li>
                                    <li><Link to="/livraison-retours" className="hover:text-pink-300 transition-colors">Livraison & retours</Link></li>
                                    <li><Link to="/confidentialite" className="hover:text-pink-300 transition-colors">Confidentialite</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-14 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 uppercase tracking-[0.25em]">
                        <p>© 2026 TKB SHOP ONLINE. Creation Haute Couture Numerique.</p>
                        <div className="flex items-center gap-3">
                            {['WAVE', 'OM', 'MOOV', 'VISA'].map((label) => (
                                <span key={label} className="border border-white/20 px-2 py-1 rounded-full text-[9px] font-black tracking-[0.2em] text-white/70">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
