import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config'; // Assure-toi d'avoir créé ce fichier config

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'verify'
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', otp: ''
  });

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
            setMode('verify'); // On passe à l'étape vérification
        } else if (mode === 'verify' || mode === 'login') {
            toast.success("Connexion réussie !");
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
        
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
            <h2 className="text-3xl font-bold text-white mb-2">
                {mode === 'login' ? 'Bon retour !' : mode === 'verify' ? 'Vérification' : 'Rejoignez-nous'}
            </h2>
            <p className="text-slate-400 text-sm">
                {mode === 'verify' ? 'Entrez le code reçu par email' : 'Accédez à votre espace TKB SHOP'}
            </p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {mode === 'register' && (
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input type="text" placeholder="Votre nom" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                )}

                {/* Champ Email (caché en mode verify pour ne pas le modifier par erreur) */}
                {mode !== 'verify' && (
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input type="email" placeholder="Votre email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                )}

                {mode !== 'verify' && (
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input type="password" placeholder="Mot de passe" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>
                )}

                {/* Champ CODE OTP (Uniquement en mode verify) */}
                {mode === 'verify' && (
                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-4">Un code a été envoyé à <strong>{formData.email}</strong></p>
                        <div className="relative">
                            <CheckCircle className="absolute left-4 top-3.5 text-green-500" size={20} />
                            <input type="text" placeholder="Code (ex: 123456)" className="w-full pl-12 pr-4 py-3 bg-white border-2 border-green-500 rounded-xl text-slate-900 font-bold tracking-widest text-center text-xl outline-none" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} required autoFocus />
                        </div>
                    </div>
                )}

                <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
                    {loading && <Loader className="animate-spin" size={20}/>}
                    {mode === 'login' ? 'Se connecter' : mode === 'verify' ? 'Valider le code' : "S'inscrire"}
                </button>

            </form>

            {mode !== 'verify' && (
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        {mode === 'login' ? "Pas encore de compte ?" : "Déjà membre ?"}
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-blue-600 font-bold ml-2 hover:underline">
                            {mode === 'login' ? "S'inscrire" : "Se connecter"}
                        </button>
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;