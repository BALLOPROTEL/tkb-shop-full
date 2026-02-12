import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    ShoppingBag,
    LogOut,
    Shield,
    Menu,
    X,
    ChevronDown,
    Heart
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api'; // Instance Axios Expert
import { useFavorites } from '../../context/FavoritesContext';

const Navbar = ({ onOpenAuth }) => {
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

        // RÉCUPÉRATION DU MESSAGE DYNAMIQUE (Backend Python)
        api.get('/api/settings')
            .then(res => setBannerText(res.data.bannerText || "BIENVENUE CHEZ TKB SHOP"))
            .catch(() => setBannerText("LIVRAISON OFFERTE DÈS 50.000 FCFA"));

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

    // 2. STRUCTURE COMPLÈTE DES CATÉGORIES (Aucune coupe)
    const navLinks = [
        { name: 'Nouveautés', path: '/' },
        { name: 'Sacs', path: '/shop/sacs' },
        {
            name: 'Chaussures',
            path: '/shop/chaussures',
            subLinks: [
                { name: 'Femme', path: '/shop/chaussures/femme' },
                { name: 'Homme', path: '/shop/chaussures/homme' },
                { name: 'Bébé', path: '/shop/chaussures/bebe' }
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
            name: 'Vêtements',
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
                <div className="container mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">

                    {/* GAUCHE : Logo & Hamburger */}
                    <div className="flex items-center gap-6 sm:gap-8">
                        <button className="lg:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} strokeWidth={1.5} />
                        </button>

                        <Link to="/" className="group">
                            <span className="font-serif text-2xl md:text-3xl tracking-tighter text-slate-900">
                                TKB<span className="font-light italic text-pink-600 group-hover:text-pink-400 transition-colors">_</span>SHOP
                            </span>
                        </Link>
                    </div>

                    {/* MILIEU : Liens avec Dropdowns Sophistiqués */}
                    <div className="hidden lg:flex items-center gap-6 xl:gap-10">
                        {navLinks.map(link => (
                            <div
                                key={link.name}
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown(link.name)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <Link
                                    to={link.path}
                                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-slate-900 hover:text-pink-600 transition-colors py-2"
                                >
                                    {link.name}
                                    {link.subLinks && <ChevronDown size={10} className={`transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />}
                                </Link>

                                {link.subLinks && activeDropdown === link.name && (
                                    <div className="absolute left-0 pt-4 w-56 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="bg-white border border-slate-100 shadow-2xl py-6 px-2 rounded-sm">
                                            {link.subLinks.map(sub => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    className="block px-6 py-3 text-[9px] uppercase tracking-[0.2em] text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-all font-bold"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* DROITE : Actions Utilisateur */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="relative" ref={profileRef}>
                            {user ? (
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="p-1.5 sm:p-2 text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full"
                                >
                                    <User size={18} strokeWidth={1.5} />
                                </button>
                            ) : (
                                <button
                                    onClick={onOpenAuth}
                                    className="p-1.5 sm:p-2 text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full"
                                    aria-label="Se connecter"
                                >
                                    <User size={18} strokeWidth={1.5} />
                                </button>
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
                                        <LogOut size={14} /> Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>

                        <Link to="/favorites" className="relative p-1.5 sm:p-2 text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full">
                            <Heart size={18} strokeWidth={1.5} />
                            {favoritesCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                                    {favoritesCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="relative p-1.5 sm:p-2 text-slate-900 hover:text-pink-600 transition-all bg-slate-50 rounded-full">
                            <ShoppingBag size={18} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* MENU MOBILE PLEIN ÉCRAN */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white z-[60] flex flex-col p-6 sm:p-10 overflow-y-auto animate-in slide-in-from-left duration-500">
                    <div className="flex justify-end mb-10">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full">
                            <X size={28} strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="space-y-6 sm:space-y-8">
                        {navLinks.map(link => (
                            <div key={link.name} className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <Link
                                        to={link.path}
                                        onClick={() => !link.subLinks && setIsMobileMenuOpen(false)}
                                        className="text-xl sm:text-2xl font-serif text-slate-900"
                                    >
                                        {link.name}
                                    </Link>
                                    {link.subLinks && (
                                        <button onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}>
                                            <ChevronDown size={20} className={`transition-transform ${activeDropdown === link.name ? 'rotate-180 text-pink-600' : ''}`} />
                                        </button>
                                    )}
                                </div>

                                {link.subLinks && activeDropdown === link.name && (
                                    <div className="pl-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        {link.subLinks.map(sub => (
                                            <Link
                                                key={sub.name}
                                                to={sub.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-pink-600"
                                            >
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-10">
                        {!user && (
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth(); }}
                                className="w-full bg-slate-900 text-white py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest"
                            >
                                Se connecter
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
