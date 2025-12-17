import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'; // Ajout de ShieldCheck
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Pour la redirection

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // NOUVEAU : État pour le mode Admin
    const [isAdminMode, setIsAdminMode] = useState(false);

    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (isOpen) {
            setIsLoginView(initialMode === 'login');
            setError('');
            setIsAdminMode(false); // On remet à zéro à l'ouverture
            setLoginData({ email: '', password: '' });
            setRegisterData({ name: '', email: '', password: '' });
        }
    }, [isOpen, initialMode]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await res.json();

            if (data.success) {
                // --- SÉCURITÉ ADMIN ICI ---
                if (isAdminMode && data.user.role !== 'admin') {
                    toast.error("Accès refusé : Vous n'êtes pas administrateur ! 👮‍♂️");
                    setIsLoading(false);
                    return; // On arrête tout, il ne passe pas.
                }

                // Sauvegarde de la session
                localStorage.setItem('user', JSON.stringify(data.user));

                toast.success(`Bienvenue ${data.user.name} ! 👋`);
                onClose();

                // Redirection intelligente
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        navigate('/admin'); // Les admins vont au tableau de bord
                    } else {
                        window.location.reload(); // Les clients restent sur le site
                    }
                }, 1000);

            } else {
                setError(data.message || "Erreur de connexion");
                toast.error("Email ou mot de passe incorrect ❌");
            }
        } catch (err) {
            toast.error("Impossible de joindre le serveur 🔌");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Compte créé ! Connectez-vous maintenant. 🎉");
                setIsLoginView(true);
                setLoginData({ email: registerData.email, password: '' });
            } else {
                const msg = data.detail || "Erreur lors de l'inscription";
                setError(msg);
                toast.error(msg);
            }
        } catch (err) {
            toast.error("Impossible de joindre le serveur 🔌");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
                    />

                    <div className="relative w-full max-w-md perspective-1000">
                        <motion.div
                            initial={false}
                            animate={{ rotateY: isLoginView ? 0 : 180 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            style={{ transformStyle: "preserve-3d" }}
                            className="relative w-full h-[550px]"
                        >

                            {/* === LOGIN (FACE AVANT) === */}
                            <div
                                className={`absolute inset-0 backface-hidden bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border-2 ${isAdminMode ? 'border-purple-500' : 'border-blue-500'} transition-colors duration-500`}
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <div className={`h-32 shrink-0 bg-gradient-to-br ${isAdminMode ? 'from-purple-900 to-slate-900' : 'from-blue-600 to-purple-600'} relative overflow-hidden flex items-center justify-center transition-all duration-500`}>
                                    <h2 className="text-3xl font-bold text-white relative z-10">
                                        {isAdminMode ? "Espace Admin" : "Bon retour !"}
                                    </h2>
                                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={24} /></button>
                                </div>

                                <div className="p-8 flex-1 flex flex-col justify-center">
                                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg text-center">{error}</div>}

                                    <form className="space-y-4" onSubmit={handleLogin}>

                                        {/* TOGGLE ADMIN */}
                                        <div className="flex items-center justify-end mb-2">
                                            <label className="flex items-center cursor-pointer gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                                                <span className="font-medium">Admin ?</span>
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" checked={isAdminMode} onChange={() => setIsAdminMode(!isAdminMode)} />
                                                    <div className={`block w-10 h-6 rounded-full ${isAdminMode ? 'bg-purple-600' : 'bg-slate-700'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAdminMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                            <input type="email" placeholder="Email" required value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500" />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                            <input type="password" placeholder="Mot de passe" required value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500" />
                                        </div>

                                        <button disabled={isLoading} className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${isAdminMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                            {isLoading ? <Loader2 className="animate-spin" /> : <>{isAdminMode ? "Accéder au Dashboard" : "Se connecter"} <ArrowRight size={18} /></>}
                                        </button>
                                    </form>

                                    <div className="mt-auto pt-6 text-center">
                                        <p className="text-slate-500">Pas encore de compte ?</p>
                                        <button onClick={() => setIsLoginView(false)} className="text-blue-400 font-bold hover:text-blue-300 hover:underline mt-1">Créer un compte</button>
                                    </div>
                                </div>
                            </div>

                            {/* === REGISTER (FACE ARRIÈRE) - Pas de mode admin ici === */}
                            <div
                                className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col border-2 border-blue-500"
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                            >
                                {/* ... (Le code du register reste identique à avant) ... */}
                                <div className="h-24 shrink-0 bg-gradient-to-bl from-pink-500 to-orange-500 relative flex items-center justify-center">
                                    <h2 className="text-2xl font-bold text-white">Rejoignez l'aventure</h2>
                                    <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white"><X size={24} /></button>
                                </div>
                                <div className="p-8 flex-1 flex flex-col justify-center">
                                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg text-center">{error}</div>}
                                    <form className="space-y-4" onSubmit={handleRegister}>
                                        <div className="relative"><User className="absolute left-4 top-3.5 text-slate-500" size={20} /><input type="text" placeholder="Nom complet" required value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" /></div>
                                        <div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-500" size={20} /><input type="email" placeholder="Email" required value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" /></div>
                                        <div className="relative"><Lock className="absolute left-4 top-3.5 text-slate-500" size={20} /><input type="password" placeholder="Mot de passe" required value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" /></div>
                                        <button disabled={isLoading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3.5 rounded-xl mt-2">{isLoading ? <Loader2 className="animate-spin" /> : "S'inscrire"}</button>
                                    </form>
                                    <div className="mt-auto pt-6 text-center"><p className="text-slate-400 text-sm">Déjà membre ?</p><button onClick={() => setIsLoginView(true)} className="text-orange-400 font-bold hover:text-orange-300 text-sm mt-1">Se connecter</button></div>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;