import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Package, LogOut, MapPin, Shield,
    Settings, Camera, Bell, CreditCard, ChevronRight, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'addresses', 'security'
    const [user, setUser] = useState(null);

    // États pour les formulaires (Simulation)
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name,
                email: parsedUser.email,
                phone: '07 07 00 00 00', // Donnée fictive pour l'exemple
                bio: 'Passionné de mode et de style.'
            });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
    };

    const handleSaveProfile = () => {
        // Ici, tu ferais un appel API pour mettre à jour l'user (PUT /api/users/...)
        // Pour l'instant, on simule la mise à jour locale
        const updatedUser = { ...user, name: formData.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        toast.success("Profil mis à jour avec succès ! ✨");
    };

    if (!user) return null;

    // --- COMPOSANTS INTERNES ---

    const MenuButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 rounded-xl text-left font-medium ${activeTab === id
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'text-slate-500 hover:bg-white hover:text-pink-600'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
            {activeTab === id && <ChevronRight size={16} className="ml-auto opacity-50" />}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-28 pb-20 px-6">
            <div className="container mx-auto max-w-6xl">

                {/* EN-TÊTE DU PROFIL */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    <div className="relative group cursor-pointer">
                        <div className="w-28 h-28 rounded-full bg-slate-900 text-white flex items-center justify-center text-4xl font-serif border-4 border-white shadow-xl">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                            <Camera size={16} />
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1 z-10">
                        <h1 className="text-3xl font-serif font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-500 mb-2">{user.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                                {user.role === 'admin' ? '👑 Administrateur' : '💎 Membre Privilège'}
                            </span>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Shield size={12} /> Vérifié
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all font-bold text-sm">
                            <LogOut size={18} /> Déconnexion
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* MENU LATÉRAL */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-200/60 sticky top-32">
                            <p className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Compte</p>
                            <MenuButton id="profile" icon={User} label="Mes Informations" />
                            <MenuButton id="addresses" icon={MapPin} label="Carnet d'adresses" />
                            <MenuButton id="security" icon={Shield} label="Sécurité" />
                            <MenuButton id="preferences" icon={Settings} label="Préférences" />

                            <div className="my-4 border-t border-slate-200 mx-4"></div>

                            <p className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Achats</p>
                            <button
                                onClick={() => navigate('/my-orders')}
                                className="w-full flex items-center gap-3 px-6 py-4 text-slate-500 hover:bg-white hover:text-blue-600 transition-all rounded-xl text-left font-medium"
                            >
                                <Package size={20} />
                                <span>Mes Commandes</span>
                            </button>
                        </div>
                    </div>

                    {/* CONTENU PRINCIPAL */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[500px] p-8 relative overflow-hidden">

                            {/* ONGLET: PROFIL */}
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif font-bold text-slate-900">Informations personnelles</h2>
                                        <button
                                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isEditing ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'}`}
                                        >
                                            {isEditing ? <><Save size={16} /> Enregistrer</> : 'Modifier'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Nom complet</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`w-full p-4 rounded-xl border ${isEditing ? 'border-pink-300 bg-pink-50 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                                            <input
                                                type="email"
                                                disabled
                                                className="w-full p-4 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                                                value={formData.email}
                                            />
                                            <p className="text-[10px] text-slate-400">* L'email ne peut pas être modifié.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Téléphone</label>
                                            <input
                                                type="tel"
                                                disabled={!isEditing}
                                                className={`w-full p-4 rounded-xl border ${isEditing ? 'border-pink-300 bg-pink-50 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Bio / Note</label>
                                            <textarea
                                                disabled={!isEditing}
                                                rows="3"
                                                className={`w-full p-4 rounded-xl border ${isEditing ? 'border-pink-300 bg-pink-50 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ONGLET: ADRESSES */}
                            {activeTab === 'addresses' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif font-bold text-slate-900">Carnet d'adresses</h2>
                                        <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
                                            + Nouvelle adresse
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Carte Adresse Principale */}
                                        <div className="border-2 border-pink-500 bg-pink-50/50 p-6 rounded-2xl relative">
                                            <span className="absolute top-4 right-4 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Par défaut</span>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-600 shadow-sm"><MapPin size={20} /></div>
                                                <h3 className="font-bold text-slate-900">Maison</h3>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                Cocody Riviera 2,<br />
                                                Rue des Jardins, Villa 145<br />
                                                Abidjan, Côte d'Ivoire
                                            </p>
                                            <div className="flex gap-3">
                                                <button className="text-xs font-bold text-slate-900 hover:underline">Modifier</button>
                                                <button className="text-xs font-bold text-red-500 hover:underline">Supprimer</button>
                                            </div>
                                        </div>

                                        {/* Carte Vide pour l'exemple */}
                                        <button className="border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 transition-all group min-h-[180px]">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                                                <MapPin size={24} />
                                            </div>
                                            <span className="font-bold text-sm">Ajouter une adresse</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ONGLET: SÉCURITÉ */}
                            {activeTab === 'security' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8">Sécurité du compte</h2>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Ancien mot de passe</label>
                                            <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Nouveau mot de passe</label>
                                            <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Confirmer le nouveau mot de passe</label>
                                            <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
                                        </div>

                                        <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all mt-4">
                                            Mettre à jour le mot de passe
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ONGLET: PRÉFÉRENCES */}
                            {activeTab === 'preferences' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8">Préférences</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Mail size={20} /></div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Newsletter</h4>
                                                    <p className="text-xs text-slate-500">Recevoir les dernières tendances et promos.</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-block w-12 h-6 rounded-full bg-green-500 cursor-pointer">
                                                <span className="absolute left-6 top-1 bg-white w-4 h-4 rounded-full transition-all shadow-sm"></span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><Bell size={20} /></div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Notifications SMS</h4>
                                                    <p className="text-xs text-slate-500">Être alerté de l'expédition des commandes.</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200 cursor-pointer">
                                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all shadow-sm"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserProfile;