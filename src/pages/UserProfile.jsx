import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Package, LogOut, Edit2, ShieldCheck, MapPin } from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Redirection si pas connecté
    if (!user) {
        navigate('/');
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('user');
        // On ne vide pas le panier ici non plus !
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Mon Compte</h1>
                        <p className="text-slate-500 mt-1">Gérez vos informations personnelles</p>
                    </div>
                    <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                        <LogOut size={20} /> Déconnexion
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* CARTE D'IDENTITÉ */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                            <p className="text-slate-500 text-sm mb-4">{user.role === 'admin' ? 'Administrateur' : 'Client Fidèle'}</p>

                            <div className="flex justify-center gap-2 mb-6">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <ShieldCheck size={12} /> Compte Vérifié
                                </span>
                            </div>

                            <button className="w-full border border-slate-200 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                <Edit2 size={16} /> Modifier photo
                            </button>
                        </div>
                    </div>

                    {/* INFORMATIONS & ACTIONS */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Mes Infos */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <User className="text-blue-500" /> Informations Personnelles
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <User size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Nom complet</p>
                                        <p className="font-medium text-slate-900">{user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <Mail size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Email</p>
                                        <p className="font-medium text-slate-900">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <MapPin size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Adresse par défaut</p>
                                        <p className="text-slate-500 italic text-sm">Aucune adresse enregistrée</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Raccourci Commandes */}
                        <Link to="/my-orders" className="block bg-blue-600 p-8 rounded-3xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all group">
                            <div className="flex justify-between items-center text-white">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Mes Commandes</h3>
                                    <p className="text-blue-100">Suivre mes colis et voir l'historique</p>
                                </div>
                                <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Package size={32} />
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfile;