import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import api from '../../api'; // UTILISATION OBLIGATOIRE DE TON INSTANCE API
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Formatage des données pour FastAPI
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : formData;

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await api.post(endpoint, payload);

            if (isLogin) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('access_token', res.data.access_token);
                toast.success(`Heureux de vous revoir ${res.data.user.name} !`);
                onClose();
                window.location.reload();
            } else {
                toast.success("Compte créé ! Connectez-vous.");
                setIsLogin(true);
            }
        } catch (err) {
            // Affiche l'erreur précise renvoyée par FastAPI
            const errorMsg = err.response?.data?.detail || "Erreur de connexion";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="p-8 text-center relative border-b border-slate-50">
                    <button onClick={onClose} className="absolute right-6 top-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={20} /></button>
                    <h2 className="text-2xl font-serif text-slate-900">{isLogin ? 'Connexion Privée' : 'Créer un compte'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-4 top-4 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Nom complet"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-pink-100 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
                        <input
                            type="email"
                            placeholder="Email professionnel"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-pink-100 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-pink-100 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Se Connecter' : 'Créer mon compte')}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        {isLogin ? "Nouveau chez TKB ?" : "Déjà un compte ?"}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-slate-900 font-bold underline"
                        >
                            {isLogin ? "Créer un profil" : "Se connecter"}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}