import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const AdminInvite = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const tokenFromQuery = searchParams.get('token') || '';
        if (!tokenFromQuery) {
            setStatus('error');
            setMessage('Token manquant');
            return;
        }

        const acceptInvite = async () => {
            try {
                await api.post('/api/admin/invites/accept', { token: tokenFromQuery });
                setStatus('success');
                setMessage('Vous etes maintenant administrateur.');
                const url = new URL(window.location.href);
                url.search = '';
                window.history.replaceState({}, document.title, url.pathname);
            } catch (err) {
                const msg = err.response?.data?.detail || 'Invitation invalide ou expiree';
                setStatus('error');
                setMessage(msg);
                toast.error(msg);
            }
        };

        acceptInvite();
    }, [searchParams]);

    return (
        <section className="relative min-h-screen bg-[#0b0b0f] text-white pt-28 pb-20 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)] opacity-70" />
            <div className="absolute -top-24 right-[-10%] w-80 h-80 sm:w-96 sm:h-96 bg-pink-500/20 blur-3xl rounded-full animate-float-slow" />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-12">
                <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 lg:p-12 animate-fade-up text-center">
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="animate-spin text-pink-600 mx-auto" size={32} />
                            <p className="mt-4 text-sm text-slate-500">Activation en cours...</p>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="text-pink-600 mx-auto" size={40} />
                            <h1 className="mt-4 text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">Invitation admin</h1>
                            <p className="mt-3 text-sm text-slate-500">{message}</p>
                            <div className="mt-6 flex justify-center gap-3">
                                <Link to="/login" className="px-5 py-3 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.3em]">
                                    Se connecter
                                </Link>
                                <Link to="/" className="px-5 py-3 border border-slate-300 text-xs font-bold uppercase tracking-[0.3em]">
                                    Accueil
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AdminInvite;
