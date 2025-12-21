import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login', 'register', 'verify'
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let endpoint = '';
        let body = {};

        if (mode === 'login') {
            endpoint = '/api/auth/login';
            body = { email: formData.email, password: formData.password };
        } else if (mode === 'register') {
            endpoint = '/api/auth/register';
            body = { name: formData.name, email: formData.email, password: formData.password };
        } else if (mode === 'verify') {
            endpoint = '/api/auth/verify';
            body = { email: formData.email, otp: formData.otp };
        }

        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (mode === 'register') {
                    toast.success("Code envoyé par email ! 📧");
                    setMode('verify');
                } else {
                    toast.success("Connexion réussie !");
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.reload();
                    onClose();
                }
            } else {
                toast.error(data.detail || "Erreur");
            }
        } catch (error) {
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black"><X /></button>

                <div className="p-8 pt-12">
                    <h2 className="text-3xl font-bold text-center mb-6 text-slate-900">
                        {mode === 'login' ? 'Connexion' : mode === 'verify' ? 'Vérification' : 'Inscription'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="text" placeholder="Nom" className="w-full pl-12 p-3 bg-slate-50 rounded-xl" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                        )}

                        {mode !== 'verify' && (
                            <>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input type="email" placeholder="Email" className="w-full pl-12 p-3 bg-slate-50 rounded-xl" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input type="password" placeholder="Mot de passe" className="w-full pl-12 p-3 bg-slate-50 rounded-xl" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            </>
                        )}

                        {mode === 'verify' && (
                            <div className="relative">
                                <CheckCircle className="absolute left-4 top-3.5 text-green-500" size={20} />
                                <input type="text" placeholder="Code reçu (ex: 123456)" className="w-full pl-12 p-3 bg-white border-2 border-green-500 rounded-xl font-bold text-center tracking-widest text-xl" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} required autoFocus />
                            </div>
                        )}

                        <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800">
                            {loading ? <Loader className="animate-spin mx-auto" /> : (mode === 'login' ? 'Se connecter' : mode === 'verify' ? 'Valider' : "S'inscrire")}
                        </button>
                    </form>

                    {mode !== 'verify' && (
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-center text-sm text-slate-500 mt-4 hover:underline">
                            {mode === 'login' ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;