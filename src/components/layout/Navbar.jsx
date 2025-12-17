import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, User, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ onOpenAuth }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // 1. GESTION UTILISATEUR (Chargement & Écoute)
    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem('user');
            setUser(storedUser ? JSON.parse(storedUser) : null);
        };
        checkUser();
        window.addEventListener('storage', checkUser);
        // Petit hack pour écouter les changements locaux non-storage (ex: login direct)
        window.addEventListener('user-login', checkUser);
        return () => {
            window.removeEventListener('storage', checkUser);
            window.removeEventListener('user-login', checkUser);
        };
    }, []);

    // 2. GESTION SCROLL (Effet visuel)
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 3. DÉCONNEXION
    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsProfileMenuOpen(false);
        navigate('/');
        window.location.reload();
    };

    // Liens de navigation
    const navLinks = [
        { name: 'Explorer', href: '/' },
        { name: 'Hébergements', href: '/#stays' },
        ...(user ? [{ name: 'Mes Voyages', href: '/my-bookings' }] : []), // Visible seulement si connecté
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${isScrolled ? 'pt-4' : 'pt-6'}`}
            >
                <div className={`relative flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ease-in-out ${isScrolled ? 'w-[90%] md:w-[85%] bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 text-slate-900 border border-white/40' : 'w-[92%] bg-black/20 backdrop-blur-sm text-white border border-white/10'}`}>

                    {/* --- LOGO --- */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                            <span className="font-bold text-white text-lg">P</span>
                        </div>
                        <span className={`font-bold text-xl tracking-tight hidden sm:block ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                            PROTEL<span className="text-blue-500">.Travel</span>
                        </span>
                    </Link>

                    {/* --- MENU BUREAU --- */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className={`text-sm font-medium transition-all hover:-translate-y-0.5 ${isScrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-white'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* --- ZONE UTILISATEUR --- */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="relative">
                                {/* Bouton Profil (Toggle) */}
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-all border ${isScrolled ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`text-xs font-bold leading-none ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{user.name.split(' ')[0]}</span>
                                        <span className={`text-[9px] font-medium uppercase tracking-wider leading-none mt-0.5 ${isScrolled ? 'text-slate-500' : 'text-slate-300'}`}>{user.role}</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''} ${isScrolled ? 'text-slate-400' : 'text-slate-300'}`} />
                                </button>

                                {/* Dropdown Menu (Profil + Admin + Logout) */}
                                <AnimatePresence>
                                    {isProfileMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 origin-top-right"
                                        >
                                            {/* Lien Admin (Conditionnel) */}
                                            {user.role === 'admin' && (
                                                <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors">
                                                    <LayoutDashboard size={18} />
                                                    Dashboard Admin
                                                </Link>
                                            )}

                                            <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                                <User size={18} />
                                                Mon Profil
                                            </Link>

                                            <div className="h-px bg-slate-100 my-1 mx-4"></div>

                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left">
                                                <LogOut size={18} />
                                                Déconnexion
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            // --- VISITEUR ---
                            <div className="flex items-center gap-3">
                                <button onClick={() => onOpenAuth('login')} className={`text-sm font-bold px-4 py-2 transition-colors ${isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
                                    Connexion
                                </button>
                                <button onClick={() => onOpenAuth('register')} className="bg-white text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:shadow-lg transition-all active:scale-95">
                                    Inscription
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- MOBILE TOGGLE --- */}
                    <button className="md:hidden p-2 active:scale-90 transition-transform" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className={isScrolled ? 'text-slate-900' : 'text-white'} />
                    </button>
                </div>
            </motion.nav>

            {/* --- MENU MOBILE (Plein écran) --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="fixed inset-0 z-[60] bg-white/90 flex flex-col items-center justify-center"
                    >
                        <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <X className="text-slate-900" size={24} />
                        </button>

                        <div className="flex flex-col gap-6 text-center w-full max-w-xs">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <div className="w-16 h-1 bg-slate-200 mx-auto my-4 rounded-full"></div>

                            {user ? (
                                <div className="space-y-4 w-full">
                                    {user.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-bold w-full">
                                            <LayoutDashboard size={20} /> Dashboard
                                        </Link>
                                    )}
                                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-bold w-full">
                                        <User size={20} /> Mon Profil
                                    </Link>
                                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-500 font-bold py-2 w-full hover:bg-red-50 rounded-xl transition-colors">
                                        <LogOut size={20} /> Déconnexion
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 w-full">
                                    <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }} className="text-lg font-medium text-slate-600 py-2">Se connecter</button>
                                    <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('register'); }} className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-xl active:scale-95 transition-transform">Commencer</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;