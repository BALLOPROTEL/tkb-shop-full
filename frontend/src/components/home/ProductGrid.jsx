import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../api'; // Instance Expert
import { getGroupLabel, getDisplayCategory, isNewProduct, isPromo } from '../../utils/product';
import { toast } from 'react-hot-toast';
import { useFavorites } from '../../context/FavoritesContext';

export default function ProductGrid() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Tout');
    const [activeSubcategory, setActiveSubcategory] = useState('Tout');
    const [currentPage, setCurrentPage] = useState(1);
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const productsPerPage = 16;

    useEffect(() => {
        api.get('/api/products')
            .then(res => setProducts(res.data))
            .catch(() => toast.error("Erreur de chargement des produits"))
            .finally(() => setLoading(false));
    }, []);

    const groupFiltered = products.filter(p => activeCategory === 'Tout' ? true : getGroupLabel(p) === activeCategory);
    const availableSubcategories = Array.from(new Set(groupFiltered.map(p => p.subcategory).filter(Boolean)));
    const filtered = groupFiltered.filter(p => activeSubcategory === 'Tout' ? true : p.subcategory === activeSubcategory);
    const totalPages = Math.ceil(filtered.length / productsPerPage);
    const currentItems = filtered.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

    if (loading) return <div className="h-96 flex items-center justify-center animate-pulse text-pink-400 font-serif">TKB COLLECTION...</div>;

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    {['Tout', 'Sacs', 'Chaussures', 'Vêtements', 'Accessoires'].map(cat => (
                        <button key={cat} onClick={() => { setActiveCategory(cat); setActiveSubcategory('Tout'); setCurrentPage(1); }}
                            className={`px-5 sm:px-8 py-2 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {activeCategory !== 'Tout' && availableSubcategories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        <button onClick={() => { setActiveSubcategory('Tout'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubcategory === 'Tout' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
                            Tous
                        </button>
                        {availableSubcategories.map(sub => (
                            <button key={sub} onClick={() => { setActiveSubcategory(sub); setCurrentPage(1); }}
                                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubcategory === sub ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
                                {sub}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10">
                    {currentItems.map(product => (
                        <div key={product.id} className="group flex flex-col gap-4">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-50 shadow-sm">
                                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                                    {isNewProduct(product) && <span className="bg-pink-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Nouveau</span>}
                                    {isPromo(product) && <span className="bg-red-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Promo</span>}
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
                                    aria-label="Ajouter aux favoris"
                                >
                                    <Heart className={isFavorite(product.id) ? 'text-pink-600 fill-pink-600' : 'text-slate-700'} size={16} />
                                </button>
                                <Link to={`/product/${product.id}`}>
                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </Link>
                                <button onClick={() => addToCart(product, 1)} className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-all flex items-center justify-center gap-2">
                                    <ShoppingBag size={14} /> Ajouter au panier
                                </button>
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{product.name}</h3>
                                <p className="text-[9px] text-pink-400 font-bold uppercase tracking-[0.2em]">{getDisplayCategory(product)}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-pink-600 font-serif font-bold mt-1">{product.price.toLocaleString()} F CFA</p>
                                    {isPromo(product) && <p className="text-xs text-slate-300 line-through mt-1">{product.oldPrice.toLocaleString()} F CFA</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-20 flex justify-center items-center gap-4">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-3 border rounded-full disabled:opacity-20"><ChevronLeft /></button>
                        <span className="text-sm font-bold italic text-slate-400">Page {currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="p-3 border rounded-full disabled:opacity-20"><ChevronRight /></button>
                    </div>
                )}
            </div>
        </section>
    );
}

