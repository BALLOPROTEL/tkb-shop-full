import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShoppingBag, ShoppingCart, ChevronDown, Package, Instagram, Facebook, Twitter } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { API_BASE_URL } from '../../config';

const Navbar = ({ onOpenAuth }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [bannerText, setBannerText] = useState("Bienvenue !");

    const navigate = useNavigate();
    const { cartCount } = useCart();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);

        fetch(`${API_BASE_URL}/api/settings`)
            .then(res => res.json())
            .then(data => setBannerText(data.bannerText || "Bienvenue !"))
            .catch(err => console.error(err));

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsProfileMenuOpen(false);
        navigate('/');
        window.location.reload();
    };

    const closeMenu = () => {
        setIsOpen(false);
        setIsProfileMenuOpen(false);
    };

    const navLinks = [
        { name: 'Nouveautés', href: '/' },
        { name: 'Sacs', href: '/#sacs' },
        { name: 'Chaussures', href: '/#chaussures' },
        { name: 'Accessoires', href: '/#accessoires' },
    ];

    return (
        <>
            {/* BANDEAU PUB */}
            <div className="bg-pink-600 text-white text-xs font-bold py-2 overflow-hidden relative z-50">
                <div className="whitespace-nowrap animate-marquee flex gap-10">
                    <span>{bannerText}</span><span>•</span><span>{bannerText}</span><span>•</span><span>{bannerText}</span>
                </div>
            </div>

            {/* NAVBAR */}
            <nav className={`sticky top-0 w-full z-40 transition-all duration-300 ${isScrolled
                ? 'bg-white/95 backdrop-blur-md shadow-md py-3 text-slate-900'
                : 'bg-[#fff0f5] py-4 text-slate-800'
                }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">

                    {/* LOGO */}
                    <Link to="/" className="text-xl font-extrabold flex items-center gap-2 tracking-tighter z-50 relative">
                        <div className={`p-1.5 rounded-lg transition-colors ${isScrolled ? 'bg-pink-600 text-white' : 'bg-slate-900 text-pink-200'}`}>
                            <ShoppingBag size={20} />
                        </div>
                        <span className="font-serif tracking-wide">TKB<span className="text-pink-600">_SHOP</span></span>
                    </Link>

                    {/* MENU DESKTOP */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} className="font-medium hover:text-pink-600 transition-colors uppercase text-xs tracking-widest">
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* ZONE DROITE */}
                    <div className="flex items-center gap-4">
                        <Link to="/cart" className="relative hover:text-pink-600 transition-colors">
                            <ShoppingCart size={24} />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Desktop */}
                        <div className="hidden md:block">
                            {user ? (
                                <div className="relative">
                                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 font-bold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
                                        <div className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">{user.name.charAt(0).toUpperCase()}</div>
                                        <span className="max-w-[80px] truncate text-xs">{user.name}</span>
                                        <ChevronDown size={14} />
                                    </button>
                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-pink-100 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                                            {user.role === 'admin' && <Link to="/admin" onClick={closeMenu} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-pink-50 text-slate-700"><Package size={16} /> Admin</Link>}
                                            <Link to="/profile" onClick={closeMenu} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-pink-50 text-slate-700"><User size={16} /> Profil</Link>
                                            <Link to="/my-orders" onClick={closeMenu} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-pink-50 text-slate-700"><Package size={16} /> Commandes</Link>
                                            <div className="border-t my-1"></div>
                                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"><LogOut size={16} /> Déconnexion</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => onOpenAuth('login')} className="text-sm font-bold hover:text-pink-600">Connexion</button>
                            )}
                        </div>

                        {/* BOUTON BURGER (Mobile) */}
                        <button className="md:hidden z-50 relative p-1" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <X size={28} className="text-slate-900" /> : <Menu size={28} className="text-slate-900" />}
                        </button>
                    </div>
                </div>

                {/* --- MENU MOBILE LUXE --- */}
                {isOpen && (
                    <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-white z-[60] flex flex-col pt-24 animate-in slide-in-from-top-10 duration-300">
                        {/* Bouton fermer */}
                        <button className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors" onClick={closeMenu}>
                            <X size={24} />
                        </button>

                        {/* Liens de navigation */}
                        <div className="flex flex-col gap-2 px-6 overflow-y-auto flex-grow">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Menu</p>
                            {navLinks.map((link) => (
                                <a key={link.name} href={link.href} onClick={closeMenu} className="text-2xl font-serif font-bold text-slate-900 py-3 border-b border-slate-50 hover:text-pink-600 transition-colors">
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        {/* ZONE UTILISATEUR (FOOTER DU MENU) */}
                        <div className="mt-auto bg-slate-50 border-t border-slate-200 p-6 pb-10">
                            {user ? (
                                <div className="space-y-3">
                                    {/* CARTE PROFIL CLIQUABLE */}
                                    <Link to="/UserProfile" onClick={closeMenu} className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100">
                                        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg leading-tight">{user.name}</p>
                                            <p className="text-xs text-pink-600 font-bold">Voir mon profil</p>
                                        </div>
                                        <div className="ml-auto bg-slate-100 p-2 rounded-full">
                                            <User size={16} className="text-slate-400" />
                                        </div>
                                    </Link>

                                    <Link to="/my-orders" onClick={closeMenu} className="flex items-center justify-between p-4 bg-white rounded-xl font-medium text-slate-700 shadow-sm active:scale-95 transition-all">
                                        <span>📦 Mes Commandes</span>
                                        <ChevronDown size={16} className="-rotate-90 text-slate-400" />
                                    </Link>

                                    {user.role === 'admin' && (
                                        <Link to="/admin" onClick={closeMenu} className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl font-medium shadow-lg active:scale-95 transition-all">
                                            <span>👑 Espace Admin</span>
                                            <ChevronDown size={16} className="-rotate-90 text-slate-400" />
                                        </Link>
                                    )}

                                    <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors mt-2">
                                        Se déconnecter
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-center text-sm text-slate-500 mb-2">Connectez-vous pour accéder à votre espace</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* BOUTON CONNEXION (NOIR) */}
                                        <button
                                            onClick={() => { onOpenAuth('login'); closeMenu(); }}
                                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            <User size={18} /> Se connecter
                                        </button>

                                        {/* BOUTON INSCRIPTION (ROSE) */}
                                        <button
                                            onClick={() => { onOpenAuth('register'); closeMenu(); }}
                                            className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            Créer un compte
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* MINI FOOTER INTEGRÉ (Réseaux Sociaux) */}
                            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col items-center gap-4">
                                <div className="flex gap-6 text-slate-400">
                                    <Instagram size={20} className="hover:text-pink-600 transition-colors cursor-pointer" />
                                    <Facebook size={20} className="hover:text-blue-600 transition-colors cursor-pointer" />
                                    <Twitter size={20} className="hover:text-blue-400 transition-colors cursor-pointer" />
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                                    © 2025 TKB_SHOP • Tous droits réservés
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
        </>
    );
};

export default Navbar;