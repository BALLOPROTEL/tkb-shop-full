import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            toast.success("Si ce compte existe, un lien de reinitialisation a ete envoye.");
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Erreur de reinitialisation";
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
                        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">Mot de passe oublie</h1>
                        <Link to="/login" className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500 hover:text-slate-900">
                            Se connecter
                        </Link>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                        Entrez votre email. Nous vous enverrons un lien pour reinitialiser votre mot de passe.
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-pink-600 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? '...' : 'Envoyer'} <ArrowRight size={14} />
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold text-slate-400">
                            <Sparkles size={12} /> Consultez votre email
                        </div>
                        <p className="mt-2">
                            Nous vous avons envoye un lien de reinitialisation si ce compte existe.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForgotPassword;
