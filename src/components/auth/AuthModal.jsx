import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader, Square, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' ou 'register'
    const [loading, setLoading] = useState(false);
    const [isHuman, setIsHuman] = useState(false); // État pour la checkbox robot

    const [formData, setFormData] = useState({
        name: '', email: '', password: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérification anti-robot
        if (!isHuman) {
            toast.error("Veuillez cocher la case 'Je ne suis pas un robot'");
            return;
        }

        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login'
            ? { email: formData.email, password: formData.password }
            : { name: formData.name, email: formData.email, password: formData.password };

        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (mode === 'register') {
                    toast.success("Compte créé ! Veuillez vous connecter.");
                    setMode('login'); // Basculer vers connexion
                } else {
                    toast.success(`Bienvenue, ${data.user.name} !`);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.reload();
                    onClose();
                }
            } else {
                toast.error(data.detail || data.message || "Erreur");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur de connexion serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">

                <div className="bg-slate-900 p-8 text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <h2 className="text-3xl font-bold text-white mb-2 font-serif">
                        {mode === 'login' ? 'Bon retour' : 'Rejoignez TKB'}
                    </h2>
                    <p className="text-slate-400 text-xs uppercase tracking-widest">
                        {mode === 'login' ? 'Accédez à votre espace' : 'Créez votre compte en 1 clic'}
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {mode === 'register' && (
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input type="text" placeholder="Votre nom" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input type="email" placeholder="Votre email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input type="password" placeholder="Mot de passe" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        </div>

                        {/* --- CAPTCHA CHECKBOX --- */}
                        <div
                            onClick={() => setIsHuman(!isHuman)}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        >
                            <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isHuman ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                                {isHuman && <CheckSquare size={16} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-600 font-medium">Je ne suis pas un robot 🤖</span>
                        </div>

                        <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2 mt-2">
                            {loading && <Loader className="animate-spin" size={20} />}
                            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            {mode === 'login' ? "Pas encore de compte ?" : "Déjà membre ?"}
                            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setIsHuman(false); }} className="text-slate-900 font-bold ml-2 hover:underline">
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