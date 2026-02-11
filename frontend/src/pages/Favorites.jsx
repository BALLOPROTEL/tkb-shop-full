import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowUpDown } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { getDisplayCategory, getGroupLabel, isNewProduct, isPromo } from '../utils/product';

const Favorites = () => {
    const { favorites, toggleFavorite, isFavorite } = useFavorites();
    const [sortBy, setSortBy] = React.useState('recent');
    const [currentPage, setCurrentPage] = React.useState(1);
    const perPage = 16;

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

    if (favorites.length === 0) {
        return (
            <div className="min-h-screen bg-white pt-32 pb-20 px-6 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Heart size={48} className="mx-auto text-pink-300" />
                    <h1 className="text-2xl font-serif text-slate-900">Aucun favori pour le moment</h1>
                    <p className="text-slate-500 text-sm">Ajoute des produits avec le cœur pour les retrouver ici.</p>
                    <Link to="/" className="inline-block mt-4 bg-slate-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest">Découvrir la collection</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-10 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-pink-400">
                        <Heart size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Favoris</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900">Mes pièces aimées</h1>
                </div>

                <div className="flex items-center justify-between mb-8">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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
                    <div className="mt-16 flex justify-center items-center gap-4">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-3 border rounded-full disabled:opacity-20">Précédent</button>
                        <span className="text-sm font-bold italic text-slate-400">Page {currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="p-3 border rounded-full disabled:opacity-20">Suivant</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
