import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader, CheckCircle, Square, CheckSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    // Modes : 'login', 'register', 'verify' (inscription), 'forgot', 'reset' (nouveau mdp)
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [isHuman, setIsHuman] = useState(false); // Captcha maison

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', otp: '', newPassword: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérification CAPTCHA (Uniquement pour Register et Login)
        if ((mode === 'register' || mode === 'login') && !isHuman) {
            toast.error("Veuillez cocher la case 'Je ne suis pas un robot'");
            return;
        }

        setLoading(true);
        let endpoint = '';
        let body = {};

        // CONFIGURATION DES ROUTES
        if (mode === 'login') {
            endpoint = '/api/auth/login';
            body = { email: formData.email, password: formData.password };
        } else if (mode === 'register') {
            endpoint = '/api/auth/register';
            body = { name: formData.name, email: formData.email, password: formData.password };
        } else if (mode === 'verify') {
            endpoint = '/api/auth/verify';
            body = { email: formData.email, otp: formData.otp };
        } else if (mode === 'forgot') {
            endpoint = '/api/auth/forgot-password';
            body = { email: formData.email };
        } else if (mode === 'reset') {
            endpoint = '/api/auth/reset-password';
            body = { email: formData.email, code: formData.otp, new_password: formData.newPassword };
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
                } else if (mode === 'forgot') {
                    toast.success("Code de réinitialisation envoyé !");
                    setMode('reset');
                } else if (mode === 'reset') {
                    toast.success("Mot de passe modifié ! Connectez-vous.");
                    setMode('login');
                    setIsHuman(false);
                } else {
                    // Login ou Verify succès
                    toast.success("Bienvenue !");
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.reload();
                    onClose();
                }
            } else {
                toast.error(data.detail || "Erreur inconnue");
            }
        } catch (error) {
            toast.error("Erreur de connexion serveur");
        } finally {
            setLoading(false);
        }
    };

    // Titres dynamiques
    const getTitle = () => {
        if (mode === 'login') return 'Connexion';
        if (mode === 'register') return 'Inscription';
        if (mode === 'verify') return 'Vérification';
        if (mode === 'forgot') return 'Mot de passe oublié';
        if (mode === 'reset') return 'Nouveau mot de passe';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black"><X /></button>

                <div className="p-8 pt-10">
                    <div className="flex items-center gap-2 mb-6">
                        {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
                            <button onClick={() => setMode('login')} className="p-1 rounded-full hover:bg-slate-100"><ArrowLeft size={20} /></button>
                        )}
                        <h2 className="text-2xl font-bold text-slate-900">{getTitle()}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {mode === 'register' && (
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="text" placeholder="Nom complet" className="w-full pl-12 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                        )}

                        {/* Email (Partout sauf Reset où on l'a déjà) */}
                        {(mode !== 'reset' && mode !== 'verify') && (
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="email" placeholder="Email" className="w-full pl-12 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                        )}

                        {/* Password (Login, Register) */}
                        {(mode === 'login' || mode === 'register') && (
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="password" placeholder="Mot de passe" className="w-full pl-12 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        )}

                        {/* Code OTP (Verify, Reset) */}
                        {(mode === 'verify' || mode === 'reset') && (
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-2">Code envoyé à {formData.email}</p>
                                <div className="relative">
                                    <CheckCircle className="absolute left-4 top-3.5 text-green-500" size={20} />
                                    <input type="text" placeholder="Code (ex: 123456)" className="w-full pl-12 p-3 bg-white border-2 border-green-500 rounded-xl font-bold text-center tracking-widest text-xl outline-none" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} required autoFocus />
                                </div>
                            </div>
                        )}

                        {/* Nouveau Password (Reset) */}
                        {mode === 'reset' && (
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="password" placeholder="Nouveau mot de passe" className="w-full pl-12 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} required />
                            </div>
                        )}

                        {/* CAPTCHA MAISON (Checkbox) - Uniquement pour Login/Register */}
                        {(mode === 'login' || mode === 'register') && (
                            <div
                                onClick={() => setIsHuman(!isHuman)}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                                <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isHuman ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                                    {isHuman && <CheckSquare size={16} className="text-white" />}
                                </div>
                                <span className="text-sm text-slate-600 font-medium">Je ne suis pas un robot 🤖</span>
                            </div>
                        )}

                        <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
                            {loading && <Loader className="animate-spin" size={18} />}
                            {mode === 'login' ? 'Se connecter' : mode === 'register' ? "S'inscrire" : mode === 'forgot' ? 'Envoyer le code' : 'Valider'}
                        </button>
                    </form>

                    {/* Liens bas de page */}
                    <div className="mt-6 text-center space-y-2">
                        {mode === 'login' && (
                            <button onClick={() => setMode('forgot')} className="text-sm text-slate-500 hover:text-slate-900 underline">
                                Mot de passe oublié ?
                            </button>
                        )}

                        {(mode === 'login' || mode === 'register') && (
                            <p className="text-sm text-slate-500">
                                {mode === 'login' ? "Pas de compte ?" : "Déjà membre ?"}
                                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setIsHuman(false); }} className="text-slate-900 font-bold ml-2 hover:underline">
                                    {mode === 'login' ? "S'inscrire" : "Se connecter"}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;