import React from 'react';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const navigate = useNavigate();
    const userStored = localStorage.getItem('user');

    // Si pas connecté, on renvoie à l'accueil
    if (!userStored) {
        navigate('/');
        return null;
    }

    const user = JSON.parse(userStored);

    const handleLogout = () => {
        localStorage.removeItem('user'); // On supprime la session
        window.location.href = '/'; // On recharge pour mettre à jour la navbar
    };

    return (
        <div className="container mx-auto px-6 py-24 min-h-screen bg-slate-50">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Mon Espace</h1>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-2xl mx-auto">

                {/* En-tête Profil */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left">
                    <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">{user.name}</h2>
                        <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200">
                            {user.role}
                        </span>
                    </div>
                </div>

                <hr className="border-slate-100 my-6" />

                {/* Informations */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-2 bg-white rounded-full shadow-sm"><Mail className="text-slate-400" size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                            <p className="font-medium text-slate-900">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-2 bg-white rounded-full shadow-sm"><Shield className="text-slate-400" size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">ID Compte</p>
                            <p className="font-mono text-sm text-slate-600">{user.id}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <Link to="/my-bookings" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">
                        Voir mes réservations
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={18} /> Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;