import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    ShoppingBag,
    LogOut,
    Shield,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    Heart,
    Search,
    MapPin
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api'; // Instance Axios Expert
import { useFavorites } from '../../context/FavoritesContext';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [bannerText, setBannerText] = useState("CHARGEMENT...");

    const navigate = useNavigate();
    const location = useLocation();
    const { cartCount } = useCart();
    const { favoritesCount } = useFavorites();
    const profileRef = useRef(null);

    // 1. GESTION DU SCROLL ET DE L'AUTH
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // RECUPERATION DU MESSAGE DYNAMIQUE (Backend Python)
        api.get('/api/settings')
            .then(res => setBannerText(res.data.bannerText || "BIENVENUE CHEZ TKB SHOP"))
            .catch(() => setBannerText("LIVRAISON OFFERTE DES 50.000 FCFA"));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        setUser(null);
        navigate('/');
        window.location.reload();
    };

    const focusHomeSearch = () => {
        const input = document.getElementById('home-search');
        if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
        }
    };

    const handleSearchClick = () => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => focusHomeSearch(), 250);
            return;
        }
        focusHomeSearch();
    };

    // 2. STRUCTURE COMPLETE DES CATEGORIES (Aucune coupe)
    const navLinks = [
        { name: 'Nouveautes', path: '/' },
        { name: 'Sacs', path: '/shop/sacs' },
        {
            name: 'Chaussures',
            path: '/shop/chaussures',
            subLinks: [
                { name: 'Femme', path: '/shop/chaussures/femme' },
                { name: 'Homme', path: '/shop/chaussures/homme' },
                { name: 'Bebe', path: '/shop/chaussures/bebe' }
            ]
        },
        {
            name: 'Accessoires',
            path: '/shop/accessoires',
            subLinks: [
                { name: 'Colliers', path: '/shop/accessoires/colliers' },
                { name: 'Bagues', path: '/shop/accessoires/bagues' },
                { name: 'Bracelets', path: '/shop/accessoires/bracelets' }
            ]
        },
        {
            name: 'Vetements',
            path: '/shop/vetements',
            subLinks: [
                { name: 'Robes', path: '/shop/vetements/robes' },
                { name: 'Abayas', path: '/shop/vetements/abayas' },
                { name: 'Voiles & Hijabs', path: '/shop/vetements/voiles-et-hijabs' }
            ]
        },
    ];

    return (
        <header className="fixed top-0 w-full z-50 transition-all duration-500">
            {/* BANDEAU ANNONCE DYNAMIQUE */}
            <div className="bg-slate-950 text-white py-2 sm:py-2.5 text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.4em] font-black text-center uppercase border-b border-white/5 px-2 sm:px-0 leading-relaxed">
                {bannerText}
            </div>

            {/* NAVIGATION PRINCIPALE */}
            <nav className={`transition-all duration-500 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md py-3 sm:py-4 shadow-sm border-b border-slate-100'
                    : 'bg-transparent py-4 sm:py-7 border-b border-transparent'
                }`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-[1fr_auto_1fr] items-center">

                    {/* GAUCHE : Menu */}
                    <div className="flex items-center gap-3">
                        <button
                            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-bold text-slate-900 hover:text-pink-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Ouvrir le menu"
                        >
                            <Menu size={22} strokeWidth={1.5} />
                            <span className="hidden sm:inline">Menu</span>
                        </button>
                    </div>

                    {/* CENTRE : Logo */}
                    <div className="flex items-center justify-center">
                        <Link to="/" className="group">
                            <span className="font-serif text-2xl sm:text-3xl tracking-tighter text-slate-900">
                                TKB<span className="font-light italic text-pink-600 group-hover:text-pink-400 transition-colors">_</span>SHOP
                            </span>
                        </Link>
                    </div>

                    {/* DROITE : Actions Utilisateur */}
                    <div className="flex items-center justify-end gap-2 sm:gap-4">
                        <button
                            onClick={handleSearchClick}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full"
                            aria-label="Rechercher"
                        >
                            <Search size={18} strokeWidth={1.5} className="text-slate-900" />
                        </button>

                        <div className="relative" ref={profileRef}>
                            {user ? (
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full"
                                >
                                    <User size={18} strokeWidth={1.5} className="text-slate-900" />
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full"
                                    aria-label="Se connecter"
                                >
                                    <User size={18} strokeWidth={1.5} className="text-slate-900" />
                                </Link>
                            )}

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-6 w-48 sm:w-52 bg-white border border-slate-100 shadow-2xl py-3 rounded-xl animate-in fade-in zoom-in duration-200">
                                    <div className="px-6 py-3 border-b border-slate-50 mb-2">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Compte</p>
                                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-6 py-3 text-[10px] uppercase font-black text-blue-600 hover:bg-blue-50">
                                            <Shield size={14} /> Console admin
                                        </Link>
                                    )}
                                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-6 py-3 text-[10px] uppercase font-bold text-slate-700 hover:bg-slate-50 tracking-widest">Mon Profil</Link>
                                    <Link to="/my-orders" onClick={() => setIsProfileOpen(false)} className="block px-6 py-3 text-[10px] uppercase font-bold text-slate-700 hover:bg-slate-50 tracking-widest">Mes Achats</Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-[10px] uppercase font-black text-red-500 hover:bg-red-50 border-t border-slate-50 mt-2">
                                        <LogOut size={14} /> Deconnexion
                                    </button>
                                </div>
                            )}
                        </div>

                        <Link to="/favorites" className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full">
                            <Heart size={18} strokeWidth={1.5} className="text-slate-900" />
                            {favoritesCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                                    {favoritesCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full">
                            <ShoppingBag size={18} strokeWidth={1.5} className="text-slate-900" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* MENU MOBILE (STYLE MK) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[420px] bg-white shadow-2xl border-r border-slate-200 flex flex-col p-6 sm:p-8 overflow-y-auto animate-in slide-in-from-left duration-500">
                        <div className="flex items-center gap-3 mb-8">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-700">Close</span>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                            <Link
                                to="/favorites"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="border border-slate-200 rounded-2xl px-3 py-4 flex flex-col items-center gap-2 text-slate-900 hover:border-pink-400 transition-colors"
                            >
                                <Heart size={20} />
                                <span className="text-[11px] font-semibold">Favoris</span>
                            </Link>
                            <Link
                                to="/my-orders"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="border border-slate-200 rounded-2xl px-3 py-4 flex flex-col items-center gap-2 text-slate-900 hover:border-pink-400 transition-colors"
                            >
                                <ShoppingBag size={20} />
                                <span className="text-[11px] font-semibold text-center">Suivre ma commande</span>
                            </Link>
                            {user ? (
                                <Link
                                    to="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="border border-slate-200 rounded-2xl px-3 py-4 flex flex-col items-center gap-2 text-slate-900 hover:border-pink-400 transition-colors"
                                >
                                    <User size={20} />
                                    <span className="text-[11px] font-semibold">Mon compte</span>
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="border border-slate-200 rounded-2xl px-3 py-4 flex flex-col items-center gap-2 text-slate-900 hover:border-pink-400 transition-colors"
                                >
                                    <User size={20} />
                                    <span className="text-[11px] font-semibold">Se connecter</span>
                                </Link>
                            )}
                            <Link
                                to="/contact"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="border border-slate-200 rounded-2xl px-3 py-4 flex flex-col items-center gap-2 text-slate-900 hover:border-pink-400 transition-colors"
                            >
                                <MapPin size={20} />
                                <span className="text-[11px] font-semibold text-center">Trouver une boutique</span>
                            </Link>
                        </div>

                        <div className="space-y-5">
                            {navLinks.map(link => (
                                <div key={link.name} className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <Link
                                            to={link.path}
                                            onClick={() => !link.subLinks && setIsMobileMenuOpen(false)}
                                            className="text-lg font-semibold text-slate-900"
                                        >
                                            {link.name}
                                        </Link>
                                        {link.subLinks ? (
                                            <button onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}>
                                                {activeDropdown === link.name ? (
                                                    <ChevronDown size={18} className="text-slate-700" />
                                                ) : (
                                                    <ChevronRight size={18} className="text-slate-700" />
                                                )}
                                            </button>
                                        ) : null}
                                    </div>

                                    {link.subLinks && activeDropdown === link.name && (
                                        <div className="pl-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            {link.subLinks.map(sub => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="block text-sm font-semibold text-slate-500 hover:text-pink-600"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 border-t border-slate-200 pt-6 space-y-4">
                            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-slate-700">
                                Nous contacter
                            </Link>
                            <div className="text-xs uppercase tracking-widest text-slate-400">France | FR €</div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
