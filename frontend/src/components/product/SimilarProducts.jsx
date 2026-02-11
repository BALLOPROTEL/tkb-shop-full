import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { getGroupLabel, getDisplayCategory, isNewProduct, isPromo } from '../../utils/product';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { Sparkles, Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

const SimilarProducts = ({ currentProductId, currentGroup }) => {
    const [similar, setSimilar] = useState([]);
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        if (!currentGroup) return;
        api.get('/api/products')
            .then(res => {
                const filtered = res.data
                    .filter(p => getGroupLabel(p) === currentGroup && p.id !== currentProductId)
                    .slice(0, 8);
                setSimilar(filtered);
            })
            .catch(err => console.error("Erreur similar products", err));
    }, [currentProductId, currentGroup]);

    if (similar.length === 0) return null;

    return (
        <section className="py-16 border-t border-pink-50">
            <div className="text-center mb-12 space-y-2">
                <div className="flex items-center justify-center gap-2 text-pink-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Complétez votre look</span>
                </div>
                <h2 className="text-2xl font-serif text-slate-900">Vous aimerez aussi</h2>
            </div>

            <Swiper
                modules={[Autoplay]}
                spaceBetween={24}
                slidesPerView={2}
                loop={similar.length > 4}
                autoplay={{ delay: 3500 }}
                breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }}
                className="pb-10"
            >
                {similar.map((product) => (
                    <SwiperSlide key={product.id}>
                        <Link to={`/product/${product.id}`} className="group block">
                            <div className="relative aspect-[3/4] bg-[#fff0f5] rounded-xl overflow-hidden mb-4 shadow-sm">
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
                                    className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center shadow"
                                    aria-label="Ajouter aux favoris"
                                >
                                    <Heart className={isFavorite(product.id) ? 'text-pink-600 fill-pink-600' : 'text-slate-700'} size={14} />
                                </button>
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-pink-400 font-bold uppercase tracking-widest">{getDisplayCategory(product)}</p>
                                <h3 className="font-serif text-sm text-slate-900 truncate">{product.name}</h3>
                                <p className="text-xs font-bold text-slate-900 mt-1">{product.price.toLocaleString()} F</p>
                            </div>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

export default SimilarProducts;
