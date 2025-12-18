import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShoppingBag, ShoppingCart, ChevronDown, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Navbar = ({ onOpenAuth }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [bannerText, setBannerText] = useState("Bienvenue !");

    const navigate = useNavigate();
    const { cartCount } = useCart();
    const API_URL = "http://127.0.0.1:8000";

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);

        fetch(`${API_URL}/api/settings`)
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
            {/* BANDEAU PUB (Reste relative z-50) */}
            <div className="bg-pink-500 text-white text-xs font-bold py-2 overflow-hidden relative z-50">
                <div className="whitespace-nowrap animate-marquee flex gap-10">
                    <span>{bannerText}</span><span>•</span><span>{bannerText}</span><span>•</span><span>{bannerText}</span>
                </div>
            </div>

            {/* NAVBAR (Modifié : sticky au lieu de fixed) */}
            <nav className={`sticky top-0 w-full z-40 transition-all duration-300 ${isScrolled
                ? 'bg-white/95 backdrop-blur-md shadow-md py-3 text-slate-900'
                : 'bg-[#fff0f5] py-4 text-slate-800'
                }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">

                    {/* LOGO */}
                    {/* LOGO MODIFIÉ */}
                    <Link to="/" className="text-xl font-extrabold flex items-center gap-2 tracking-tighter z-50 relative">
                        <div className={`p-1.5 rounded-lg transition-colors ${isScrolled ? 'bg-pink-600 text-white' : 'bg-slate-900 text-pink-200'}`}>
                            <ShoppingBag size={20} />
                        </div>
                        {/* TEXTE CHANGÉ ICI */}
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

                {/* --- MENU MOBILE (OVERLAY CORRIGÉ) --- */}
                {/* z-[60] pour passer devant la pub qui est z-50 */}
                {isOpen && (
                    <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-white z-[60] flex flex-col pt-24 px-6 animate-in slide-in-from-top-10 duration-300">
                        {/* Bouton fermer en haut à droite (sécurité) */}
                        <button className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full" onClick={closeMenu}>
                            <X size={24} />
                        </button>

                        <div className="flex flex-col gap-6 text-xl font-serif font-bold text-slate-900">
                            {navLinks.map((link) => (
                                <a key={link.name} href={link.href} onClick={closeMenu} className="border-b border-slate-100 pb-2 hover:text-pink-600">
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            {user ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-lg font-bold">{user.name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Bonjour, {user.name}</p>
                                            <p className="text-xs text-slate-500">Membre privilège</p>
                                        </div>
                                    </div>
                                    <Link to="/profile" onClick={closeMenu} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-pink-50"><User size={20} /> Mon Profil</Link>
                                    <Link to="/my-orders" onClick={closeMenu} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-pink-50"><Package size={20} /> Mes Commandes</Link>
                                    {user.role === 'admin' && <Link to="/admin" onClick={closeMenu} className="flex items-center gap-3 p-3 bg-slate-900 text-white rounded-xl"><Package size={20} /> Espace Admin</Link>}
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl mt-2"><LogOut size={20} /> Déconnexion</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => { onOpenAuth('login'); closeMenu(); }} className="py-3 border border-slate-200 rounded-xl font-bold">Connexion</button>
                                    <button onClick={() => { onOpenAuth('register'); closeMenu(); }} className="py-3 bg-slate-900 text-white rounded-xl font-bold">Inscription</button>
                                </div>
                            )}
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