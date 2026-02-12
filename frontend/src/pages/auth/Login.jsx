import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', formData);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('access_token', res.data.access_token);
            toast.success(`Bienvenue ${res.data.user.name} !`);
            navigate('/');
            window.location.reload();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Erreur de connexion";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative min-h-screen bg-[#0b0b0f] text-white pt-28 pb-20 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)] opacity-70" />
            <div className="absolute -top-24 right-[-10%] w-80 h-80 sm:w-96 sm:h-96 bg-pink-500/20 blur-3xl rounded-full animate-float-slow" />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-stretch">
                    {/* LEFT: Editorial */}
                    <div className="w-full lg:flex-1 min-w-0 rounded-3xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-lg shadow-2xl animate-fade-up">
                        <div className="relative h-full">
                            <img
                                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop"
                                alt="TKB Shop editorial"
                                className="w-full h-full object-cover min-h-[520px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.35em] font-bold">
                                    <Sparkles size={12} /> TKB SELECT
                                </div>
                                <h2 className="mt-4 text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">
                                    Elegance au quotidien
                                </h2>
                                <p className="mt-2 text-sm text-white/80">
                                    Des pieces rares, une experience fluide, un univers inspire.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Form */}
                    <div className="w-full lg:flex-1 min-w-0 bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 lg:p-12 animate-fade-up">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">Se connecter</h1>
                            <Link to="/register" className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500 hover:text-slate-900">
                                Creer un compte
                            </Link>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Connectez-vous avec votre email et votre mot de passe.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="accent-slate-900" />
                                    Se souvenir de moi
                                </label>
                                <button type="button" className="underline hover:text-slate-900">
                                    Mot de passe oublie ?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-pink-600 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? '...' : 'Se connecter'} <ArrowRight size={14} />
                            </button>
                        </form>

                        <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
                            En vous connectant, vous acceptez nos conditions et notre politique de confidentialite.
                        </div>
                    </div>
                </div>

                {/* Suivre ma commande */}
                <div className="mt-12 bg-white/95 text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h3 className="text-lg sm:text-xl font-serif uppercase tracking-[0.2em]">Consulter le statut de votre commande</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Entrez votre numero de commande et votre email pour suivre votre livraison.
                    </p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                        <input
                            type="text"
                            placeholder="Numero de commande"
                            className="w-full px-4 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                        />
                        <button
                            type="button"
                            className="px-6 py-3 bg-slate-900 text-white uppercase tracking-[0.3em] text-[11px] font-black hover:bg-pink-600 transition-all"
                        >
                            Verifier
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
