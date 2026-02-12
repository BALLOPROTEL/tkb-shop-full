import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; // Import instance Axios corrigé
import { getDisplayCategory, getGroupLabel, isNewProduct, isPromo } from '../utils/product';
import Hero from '../components/home/Hero';
import { Loader2, Sparkles, Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toggleFavorite, isFavorite } = useFavorites();
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 16;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/api/products');
                // Avec Axios, les données sont dans res.data
                setProducts(res.data.reverse());
            } catch (error) {
                console.error("Erreur produits:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredProducts.length / perPage);
    const pageItems = filteredProducts.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="bg-white min-h-screen">
            <Hero searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20">
                <div className="text-center mb-20 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-pink-500 animate-pulse">
                        <Sparkles size={16} />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em]">Sélection exclusive</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-900">Pièces d'Exception</h2>
                    <div className="w-12 h-[1px] bg-pink-200 mx-auto"></div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-pink-600" size={32} />
                    </div>
                ) : (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-16">
                        {pageItems.map((product) => {
                            const displayImages = product.images?.length > 0 ? product.images : [product.image];
                            return (
                                <div key={product.id} className="group">
                                    <Link to={`/product/${product.id}`}>
                                        <div className="relative aspect-[3/4] overflow-hidden bg-[#fff0f5] rounded-sm mb-6 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
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
                                            <Swiper
                                                modules={[Autoplay, EffectFade]}
                                                effect="fade"
                                                autoplay={{ delay: 3000 }}
                                                className="w-full h-full"
                                            >
                                                {displayImages.map((img, idx) => (
                                                    <SwiperSlide key={idx}>
                                                        <img
                                                            src={img}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                                                        />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <div className="absolute inset-0 bg-pink-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                                            <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">
                                                <div className="bg-white/90 backdrop-blur-md py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-lg">
                                                    Découvrir la pièce
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="space-y-2 text-center">
                                        <p className="text-[9px] text-pink-400 font-bold uppercase tracking-[0.2em]">{getDisplayCategory(product)}</p>
                                        <h3 className="font-serif text-xl text-slate-900 group-hover:text-pink-600 transition-colors">{product.name}</h3>
                                        <div className="flex items-center justify-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">{product.price.toLocaleString()} FCFA</p>
                                            {isPromo(product) && <p className="text-xs text-slate-300 line-through">{product.oldPrice.toLocaleString()} FCFA</p>}
                                        </div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;

