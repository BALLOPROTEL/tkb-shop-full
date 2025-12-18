import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);

    // --- CORRECTION ICI : ON PASSE EN LOCAL ---
    // const API_URL = "https://protel-backend.onrender.com"; // <--- ANCIEN (CLOUD)
    const API_URL = "http://127.0.0.1:8000"; // <--- NOUVEAU (LOCAL)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(mode === 'login' ? "Connexion réussie !" : "Compte créé !");

                // Si connexion réussie, on sauvegarde l'user
                if (mode === 'login' || data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user || {
                        id: data.userId,
                        name: formData.name,
                        email: formData.email,
                        role: 'client'
                    }));
                    window.location.reload(); // Recharger pour mettre à jour la Navbar
                } else {
                    // Si inscription, on bascule vers la connexion
                    setMode('login');
                }
                onClose();
            } else {
                toast.error(data.detail || data.message || "Une erreur est survenue");
            }
        } catch (error) {
            console.error(error);
            toast.error("Impossible de joindre le serveur local 🔌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">

                {/* Header avec dégradé */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {mode === 'login' ? 'Bon retour !' : 'Rejoignez-nous'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' ? 'Connectez-vous pour accéder à votre espace' : 'Créez votre compte en quelques secondes'}
                    </p>
                </div>

                {/* Formulaire */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {mode === 'register' && (
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Votre nom"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                type="email"
                                placeholder="Votre email"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                        >
                            {loading && <Loader className="animate-spin" size={20} />}
                            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            {mode === 'login' ? "Pas encore de compte ?" : "Déjà membre ?"}
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-blue-600 font-bold ml-2 hover:underline"
                            >
                                {mode === 'login' ? "S'inscrire" : "Se connecter"}
                            </button>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthModal;