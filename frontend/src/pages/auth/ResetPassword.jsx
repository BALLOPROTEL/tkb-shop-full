import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromQuery = searchParams.get('token') || '';
    const [token, setToken] = useState(tokenFromQuery);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tokenFromQuery) {
            setToken(tokenFromQuery);
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState({}, document.title, url.pathname);
        }
    }, [tokenFromQuery]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            toast.error('Token manquant');
            return;
        }
        if (password.length < 6) {
            toast.error('Mot de passe trop court');
            return;
        }
        if (password !== confirm) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', { token, password });
            toast.success('Mot de passe reinitialise');
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Erreur de reinitialisation';
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
                <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 lg:p-12 animate-fade-up">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">Reinitialiser</h1>
                        <Link to="/login" className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500 hover:text-slate-900">
                            Se connecter
                        </Link>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                        Entrez le code recu et choisissez un nouveau mot de passe.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {!token && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Token
                                </label>
                                <input
                                    type="text"
                                    placeholder="Token de reinitialisation"
                                    className="w-full px-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="Nouveau mot de passe"
                                    className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                Confirmer
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="Confirmer le mot de passe"
                                    className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-pink-600 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? '...' : 'Reinitialiser'} <ArrowRight size={14} />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ResetPassword;
