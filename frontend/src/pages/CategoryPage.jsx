import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { slugify, normalizeCategorySlug, getGroupLabel, getGroupLabelFromSlug, getSubcategoryLabelFromSlug, getDisplayCategory, isNewProduct, isPromo } from '../utils/product';
import { Loader2, Sparkles, Heart, ArrowUpDown } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from 'react-hot-toast';

const CategoryPage = () => {
    const { category, subcategory } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubcategory, setActiveSubcategory] = useState('Tout');
    const [sortBy, setSortBy] = useState('recent');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 16;
    const categoryLabel = getGroupLabelFromSlug(category || '');
    const subcategoryLabel = subcategory ? getSubcategoryLabelFromSlug(subcategory) : '';
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        const fetchAndFilter = async () => {
            setLoading(true);
            try {
                // Rigueur Axios : on utilise api.get
                const res = await api.get('/api/products');

                // Les donnees sont directement dans res.data avec Axios
                const allProducts = res.data;

                // Logique de filtrage
                const categoryKey = normalizeCategorySlug(slugify(category || ''));

                const targetSubSlug = slugify(subcategoryLabel || subcategory || '');
                const filtered = allProducts.filter(p => {
                    const groupSlug = normalizeCategorySlug(slugify(getGroupLabel(p)));
                    const matchesCat = groupSlug === categoryKey;

                    if (targetSubSlug) {
                        const productSubSlug = slugify(p.subcategory || '');
                        if (productSubSlug === targetSubSlug) return true;
                    }

                    return matchesCat;
                });

                setProducts(filtered.reverse());
            } catch (err) {
                console.error("Erreur filtrage", err);
                toast.error("Erreur lors du chargement de la categorie");
            } finally {
                setLoading(false);
            }
        };
        fetchAndFilter();
    }, [category, subcategory, subcategoryLabel]);

    useEffect(() => {
        setActiveSubcategory(subcategoryLabel || 'Tout');
        setCurrentPage(1);
    }, [subcategoryLabel, category]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeSubcategory, sortBy, priceMin, priceMax]);

    const availableSubcategories = Array.from(new Set(products.map(p => p.subcategory).filter(Boolean)));
    const activeSubSlug = slugify(activeSubcategory || '');
    const filteredBySubcategory = activeSubcategory === 'Tout'
        ? products
        : products.filter(p => slugify(p.subcategory || '') === activeSubSlug);

    const minPrice = priceMin === '' ? null : Number(priceMin);
    const maxPrice = priceMax === '' ? null : Number(priceMax);
    const filteredByPrice = filteredBySubcategory.filter(p => {
        const price = Number(p.price);
        if (!Number.isFinite(price)) {
            return !(Number.isFinite(minPrice) || Number.isFinite(maxPrice));
        }
        if (minPrice !== null && Number.isFinite(minPrice) && price < minPrice) return false;
        if (maxPrice !== null && Number.isFinite(maxPrice) && price > maxPrice) return false;
        return true;
    });

    const sortedProducts = [...filteredByPrice].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return (Number(a.price) || Infinity) - (Number(b.price) || Infinity);
            case 'price-desc':
                return (Number(b.price) || -Infinity) - (Number(a.price) || -Infinity);
            case 'name-asc':
                return (a.name || '').localeCompare(b.name || '');
            case 'recent':
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    const totalPages = Math.ceil(sortedProducts.length / perPage);
    const pageItems = sortedProducts.slice((currentPage - 1) * perPage, currentPage * perPage);

    const resetFilters = () => {
        setActiveSubcategory('Tout');
        setPriceMin('');
        setPriceMax('');
        setSortBy('recent');
    };

    return (
                <div className="bg-white min-h-screen pt-28 sm:pt-36 lg:pt-40 pb-20">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .product-card-swiper .swiper-button-next,
                    .product-card-swiper .swiper-button-prev {
                        width: 26px;
                        height: 26px;
                        border-radius: 999px;
                        background: rgba(255,255,255,0.9);
                        box-shadow: 0 4px 12px rgba(15,23,42,0.15);
                        color: #0f172a;
                        z-index: 30;
                        pointer-events: auto;
                        transition: opacity .2s ease, transform .2s ease;
                    }
                    @media (hover: hover) and (pointer: fine) {
                        .product-card-swiper .swiper-button-next,
                        .product-card-swiper .swiper-button-prev {
                            opacity: 0;
                            transform: scale(0.96);
                        }
                        .product-card-shell:hover .swiper-button-next,
                        .product-card-shell:hover .swiper-button-prev,
                        .product-card-swiper:hover .swiper-button-next,
                        .product-card-swiper:hover .swiper-button-prev {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    @media (hover: none) and (pointer: coarse) {
                        .product-card-swiper .swiper-button-next,
                        .product-card-swiper .swiper-button-prev {
                            opacity: 1;
                        }
                    }
                    .product-card-swiper .swiper-button-next::after,
                    .product-card-swiper .swiper-button-prev::after {
                        font-size: 10px;
                        font-weight: 700;
                    }
                    `,
                }}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">

                {/* En-tete de categorie luxe */}
                <div className="text-center mb-20 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-pink-400">
                        <Sparkles size={16} />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em]">
                            {categoryLabel} {subcategoryLabel && `- ${subcategoryLabel}`}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-slate-900 capitalize">
                        {subcategoryLabel || categoryLabel}
                    </h1>
                    <p className="text-slate-400 text-sm font-light italic">
                        Une selection exclusive signee TKB_SHOP
                    </p>
                </div>

                {!loading && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-12">
                        <p className="text-sm text-slate-500">{sortedProducts.length} produit(s)</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={activeSubcategory}
                                onChange={(e) => setActiveSubcategory(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 w-full sm:w-auto"
                            >
                                <option value="Tout">Toutes sous-categories</option>
                                {availableSubcategories.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    placeholder="Prix min"
                                    className="w-full sm:w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600"
                                />
                                <input
                                    type="number"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    placeholder="Prix max"
                                    className="w-full sm:w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <ArrowUpDown size={14} className="text-slate-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 w-full sm:w-auto"
                                >
                                    <option value="recent">Recents</option>
                                    <option value="price-asc">Prix croissant</option>
                                    <option value="price-desc">Prix decroissant</option>
                                    <option value="name-asc">Nom A-Z</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            >
                                Reinitialiser
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" /></div>
                ) : sortedProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="font-serif italic text-slate-400 text-xl">Aucune piece disponible dans cette selection pour le moment.</p>
                        <Link to="/" className="mt-8 inline-block border-b border-slate-900 pb-1 text-xs font-bold uppercase tracking-widest">Retour aux nouveautes</Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                            {pageItems.map((product) => {
                                const displayImages = product.images?.length > 0 ? product.images : [product.image];
                                const promo = isPromo(product);
                                const isNew = isNewProduct(product);
                                return (
                                    <div key={product.id} className="group product-card-shell">
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
                                                aria-label="Ajouter aux favoris"
                                            >
                                                <Heart className={isFavorite(product.id) ? 'text-pink-600 fill-pink-600' : 'text-slate-700'} size={16} />
                                            </button>
                                            <Swiper
                                                modules={[Navigation]}
                                                navigation={displayImages.length > 1}
                                                slidesPerView={1}
                                                loop={displayImages.length > 1}
                                                allowTouchMove={displayImages.length > 1}
                                                className="w-full h-full product-card-swiper"
                                            >
                                                {displayImages.map((img, idx) => (
                                                    <SwiperSlide key={idx}>
                                                        <Link to={`/product/${product.id}`} className="block w-full h-full">
                                                            <img
                                                                src={img}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                                                            />
                                                        </Link>
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <div className="absolute inset-0 bg-pink-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20"
                                            >
                                                <div className="bg-white/90 backdrop-blur-md py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-lg">
                                                    Decouvrir la piece
                                                </div>
                                            </Link>
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <p className="text-[9px] text-pink-400 font-bold uppercase tracking-[0.2em]">{getDisplayCategory(product)}</p>
                                            <Link to={`/product/${product.id}`} className="inline-block">
                                                <h3 className="font-serif text-xl text-slate-900 group-hover:text-pink-600 transition-colors">{product.name}</h3>
                                            </Link>
                                            <div className="flex items-center justify-center gap-2">
                                                <p className="text-sm font-medium text-slate-900">{product.price.toLocaleString()} FCFA</p>
                                                {promo && <p className="text-xs text-slate-300 line-through">{product.oldPrice.toLocaleString()} FCFA</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-4">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-3 border rounded-full disabled:opacity-20">Precedent</button>
                                <span className="text-sm font-bold italic text-slate-400">Page {currentPage} / {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="p-3 border rounded-full disabled:opacity-20">Suivant</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;





