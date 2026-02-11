import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, CheckCircle, Heart, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useFavorites } from '../context/FavoritesContext';
import { getDisplayCategory, getGroupLabel, isNewProduct, isPromo } from '../utils/product';

const UserProfile = () => {
    const navigate = useNavigate();
    const getStoredUser = () => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    };
    const [user, setUser] = useState(getStoredUser);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [sortBy, setSortBy] = useState('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 8;
    const { favorites, toggleFavorite, isFavorite } = useFavorites();
    const [formData, setFormData] = useState(() => {
        const stored = getStoredUser();
        return {
            name: stored?.name || '',
            phone: stored?.phone || ''
        };
    });

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [navigate, user]);

    const sortedFavorites = React.useMemo(() => {
        const list = [...favorites];
        switch (sortBy) {
            case 'price-asc':
                return list.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
            case 'price-desc':
                return list.sort((a, b) => (Number(b.price) || -Infinity) - (Number(a.price) || -Infinity));
            case 'name-asc':
                return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'recent':
            default:
                return list.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
        }
    }, [favorites, sortBy]);

    const totalPages = Math.ceil(sortedFavorites.length / perPage);
    const pageItems = sortedFavorites.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handleSaveProfile = async () => {
        try {
            // Mise à jour de l'état local et du storage
            const updatedUser = { ...user, name: formData.name, phone: formData.phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            toast.success("Profil mis à jour avec succès !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        toast.success("Session clôturée");
        navigate('/');
        window.location.reload();
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* En-tête Profil */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-slate-50 pb-10">
                    <div className="w-28 h-28 rounded-full bg-slate-900 text-pink-400 flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left flex-grow">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                            <h1 className="text-3xl font-serif text-slate-900">{user.name}</h1>
                            {user.role === 'admin' && <Shield size={18} className="text-blue-500" />}
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{user.email}</p>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                            }`}>
                            {user.role === 'admin' ? 'Administrateur Système' : 'Membre Privilégié'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-100"
                    >
                        <LogOut size={16} /> Déconnexion
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => { setActiveTab('profile'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Mon profil
                    </button>
                    <button
                        onClick={() => { setActiveTab('favorites'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'favorites' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
                    >
                        Mes favoris
                    </button>
                </div>

                {activeTab === 'profile' ? (
                    <>
                        {/* Formulaire d'informations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identité Complète</label>
                                <input
                                    disabled={!isEditing}
                                    className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-pink-200 outline-none transition-all text-slate-900 font-medium disabled:opacity-60"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Sarah Koné"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Téléphonique</label>
                                <input
                                    disabled={!isEditing}
                                    type="tel"
                                    className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-pink-200 outline-none transition-all text-slate-900 font-medium disabled:opacity-60"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Ex: +225 00 00 00 00 00"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-12 flex justify-end gap-4">
                            {isEditing && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-all text-sm"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-pink-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-3"
                            >
                                {isEditing ? <CheckCircle size={16} /> : <User size={16} />}
                                {isEditing ? "Sauvegarder" : "Modifier le profil"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="mt-10">
                        {favorites.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                                <Heart size={40} className="mx-auto text-pink-300" />
                                <p className="text-slate-500 text-sm">Aucun favori pour le moment.</p>
                                <Link to="/" className="inline-block bg-slate-900 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest">Découvrir la collection</Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-sm text-slate-500">{favorites.length} produit(s)</p>
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown size={14} className="text-slate-400" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600"
                                        >
                                            <option value="recent">Récents</option>
                                            <option value="price-asc">Prix croissant</option>
                                            <option value="price-desc">Prix décroissant</option>
                                            <option value="name-asc">Nom A-Z</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {pageItems.map(product => {
                                        const promo = isPromo(product);
                                        const isNew = isNewProduct(product);
                                        return (
                                            <div key={product.id} className="group">
                                                <Link to={`/product/${product.id}`}>
                                                    <div className="relative aspect-[3/4] overflow-hidden bg-[#fff0f5] rounded-sm mb-6 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                                                        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                                                            {isNew && <span className="bg-pink-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Nouveau</span>}
                                                            {promo && <span className="bg-red-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Promo</span>}
                                                            <span className="bg-white/90 backdrop-blur px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-900">
                                                                {getGroupLabel(product)}
                                                            </span>
                                                            {product.subcategory && (
                                                                <span className="bg-white/90 backdrop-blur px-2 py-1 text-[9px] font-black uppercase tracking-widest text-pink-600">
                                                                    {product.subcategory}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                                                            className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center shadow"
                                                            aria-label="Retirer des favoris"
                                                        >
                                                            <Heart className={isFavorite(product.id) ? 'text-pink-600 fill-pink-600' : 'text-slate-700'} size={16} />
                                                        </button>
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-pink-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                                                        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">
                                                            <div className="bg-white/90 backdrop-blur-md py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-lg">
                                                                Découvrir la pièce
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="text-center space-y-2">
                                                    <p className="text-[9px] text-pink-400 font-bold uppercase tracking-[0.2em]">{getDisplayCategory(product)}</p>
                                                    <h3 className="font-serif text-xl text-slate-900 group-hover:text-pink-600 transition-colors">{product.name}</h3>
                                                    {Number.isFinite(Number(product.price)) ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <p className="text-sm font-medium text-slate-900">{Number(product.price).toLocaleString()} FCFA</p>
                                                            {promo && <p className="text-xs text-slate-300 line-through">{Number(product.oldPrice).toLocaleString()} FCFA</p>}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400">Prix indisponible</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-4">
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-3 border rounded-full disabled:opacity-20">Précédent</button>
                                        <span className="text-sm font-bold italic text-slate-400">Page {currentPage} / {totalPages}</span>
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="p-3 border rounded-full disabled:opacity-20">Suivant</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
