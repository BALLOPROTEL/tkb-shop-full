import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { setAuth } from '../../utils/authStorage';

export default function AuthModal({ isOpen, onClose }) {
    const [loadingAction, setLoadingAction] = useState(null);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
    const [remember, setRemember] = useState(true);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e, mode) => {
        e.preventDefault();
        setLoadingAction(mode);

        const payload = mode === 'login'
            ? { email: loginData.email, password: loginData.password }
            : registerData;

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await api.post(endpoint, payload);

            if (mode === 'login') {
                setAuth(res.data.user, res.data.access_token, remember);
                toast.success(`Bienvenue ${res.data.user.name} !`);
                onClose();
                window.location.reload();
            } else {
                toast.success("Compte cree ! Connectez-vous.");
                setRegisterData({ name: '', email: '', password: '' });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Erreur de connexion";
            toast.error(errorMsg);
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b0b0f] text-slate-900 overflow-y-auto">
            <div className="min-h-screen px-4 py-10 sm:py-16 flex items-center justify-center">
                <div className="relative w-full max-w-6xl bg-white border border-slate-200 shadow-2xl grid lg:grid-cols-2">
                    <button
                        onClick={onClose}
                        className="absolute left-5 top-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-600 hover:text-slate-900"
                    >
                        <X size={18} /> Close
                    </button>

                    {/* LEFT: LOGIN */}
                    <div className="px-6 sm:px-10 lg:px-12 pt-16 pb-12 lg:pb-16 border-b lg:border-b-0 lg:border-r border-slate-200">
                        <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em] text-slate-900">
                            Se connecter
                        </h2>
                        <p className="mt-3 text-sm text-slate-500">
                            Connectez-vous avec votre email et votre mot de passe.
                        </p>

                        <form onSubmit={(e) => handleSubmit(e, 'login')} className="mt-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="email@exemple.com"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Mot de passe"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="accent-slate-900"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />
                                    Se souvenir de moi
                                </label>
                                <button
                                    type="button"
                                    className="underline hover:text-slate-900"
                                    onClick={() => {
                                        onClose();
                                        navigate('/forgot-password');
                                    }}
                                >
                                    Mot de passe oublie ?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAction === 'login'}
                                className="w-full bg-slate-900 text-white py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-pink-600 transition-all"
                            >
                                {loadingAction === 'login' ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Se connecter'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: REGISTER */}
                    <div className="px-6 sm:px-10 lg:px-12 pt-16 pb-12 lg:pb-16 bg-[#f7f2ec]">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-300 text-[10px] uppercase tracking-[0.3em] font-bold">
                            <Sparkles size={12} /> TKB VIP
                        </div>
                        <h2 className="mt-4 text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em] text-slate-900">
                            Creer un compte
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Rejoignez le club TKB pour des avantages exclusifs.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-600">
                            <div className="border border-slate-300 px-3 py-3 text-center">Cadeau bienvenue</div>
                            <div className="border border-slate-300 px-3 py-3 text-center">Avant-premieres</div>
                            <div className="border border-slate-300 px-3 py-3 text-center">Paiement rapide</div>
                            <div className="border border-slate-300 px-3 py-3 text-center">Suivi commandes</div>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, 'register')} className="mt-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Nom complet
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nom complet"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={registerData.name}
                                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="email@exemple.com"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Mot de passe"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAction === 'register'}
                                className="w-full border border-slate-900 text-slate-900 py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-slate-900 hover:text-white transition-all"
                            >
                                {loadingAction === 'register' ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Creer un compte'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
