import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus, Sparkles, Ruler } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useCart } from '../context/CartContext';
import SimilarProducts from '../components/product/SimilarProducts';
import { getGroupLabel, getDisplayCategory } from '../utils/product';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/products/${id}`);
                setProduct(res.data);
                if (res.data.colors?.length > 0) setSelectedColor(res.data.colors[0]);
            } catch (err) {
                console.error(err);
                toast.error("Pièce indisponible.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    if (loading) return <div className="h-screen flex items-center justify-center">Chargement...</div>;
    if (!product) return null;

    const displayImages = product.images?.length > 0 ? product.images : [product.image];
    const groupLabel = getGroupLabel(product);
    const isShoes = groupLabel === 'Chaussures';
    const isClothing = groupLabel === 'Vetements';
    const sizes = (product.sizes && product.sizes.length > 0)
        ? product.sizes
        : (isShoes ? [36, 37, 38, 39, 40, 41] : (isClothing ? ['XS', 'S', 'M', 'L', 'XL'] : []));
    const hasSizes = sizes.length > 0;
    const displayCategory = getDisplayCategory(product);
    const sizeLabel = isShoes ? 'Pointure' : 'Taille';

    return (
        <div className="bg-white min-h-screen pt-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-pink-600 transition-all mb-12">
                    <ArrowLeft size={14} /> Retour
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-24">
                    <div className="lg:col-span-5 space-y-4">
                        <Swiper
                            style={{ '--swiper-navigation-color': '#000', '--swiper-pagination-color': '#db2777' }}
                            spaceBetween={10}
                            navigation={true}
                            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                            modules={[FreeMode, Navigation, Thumbs]}
                            className="aspect-[3/4] max-h-[600px] bg-pink-50 rounded-sm"
                        >
                            {displayImages.map((img, index) => (
                                <SwiperSlide key={index}><img src={img} className="w-full h-full object-cover" alt="" /></SwiperSlide>
                            ))}
                        </Swiper>
                        <Swiper
                            onSwiper={setThumbsSwiper}
                            spaceBetween={10}
                            slidesPerView={3}
                            breakpoints={{ 640: { slidesPerView: 4 }, 1024: { slidesPerView: 5 } }}
                            freeMode={true}
                            watchSlidesProgress={true}
                            modules={[FreeMode, Navigation, Thumbs]}
                            className="h-16 sm:h-20"
                        >
                            {displayImages.map((img, index) => (
                                <SwiperSlide key={index} className="cursor-pointer border border-pink-50 opacity-50 hover:opacity-100 transition-opacity">
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                    <div className="lg:col-span-7 flex flex-col justify-center">
                        <div className="border-b border-pink-50 pb-8 mb-8">
                            <div className="flex items-center gap-2 text-pink-400 mb-4"><Sparkles size={14} /><span className="text-[10px] font-bold uppercase tracking-[0.3em]">{displayCategory}</span></div>
                            <h1 className="text-4xl font-serif text-slate-900 mb-4">{product.name}</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-light text-slate-900">{product.price.toLocaleString()} F</span>
                                {product.oldPrice && <span className="text-lg text-slate-300 line-through">{product.oldPrice.toLocaleString()} F</span>}
                            </div>
                        </div>

                        <div className="space-y-8">
                            {product.colors?.length > 0 && (
                                <div className="space-y-3">
                                    <span className="text-[11px] font-bold uppercase tracking-widest">Nuance</span>
                                    <div className="flex gap-3">{product.colors.map(hex => <button key={hex} onClick={() => setSelectedColor(hex)} className={`w-8 h-8 rounded-full border ${selectedColor === hex ? 'border-pink-600 scale-110' : 'border-transparent'}`}><div className="w-full h-full rounded-full border border-gray-100" style={{ backgroundColor: hex }}></div></button>)}</div>
                                </div>
                            )}
                            {hasSizes && (
                                <div className="space-y-3">
                                    <div className="flex justify-between"><span className="text-[11px] font-bold uppercase tracking-widest">{sizeLabel}</span><button className="text-[10px] text-pink-600 flex items-center gap-1"><Ruler size={12} /> Guide</button></div>
                                    <div className="flex flex-wrap gap-2">{sizes.map(size => <button key={size} onClick={() => setSelectedSize(size)} className={`h-10 min-w-[40px] border text-[10px] font-bold transition-all ${selectedSize === size ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-gray-100 hover:border-pink-300'}`}>{size}</button>)}</div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-pink-50 flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center bg-pink-50/50 border border-pink-100 h-12 w-32 justify-between px-4">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                                    <span className="font-bold">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)}><Plus size={16} /></button>
                                </div>
                                <button onClick={() => {
                                    if (hasSizes && !selectedSize) return toast.error("Taille requise");
                                    addToCart(product, quantity, selectedSize, selectedColor);
                                }} className="flex-1 bg-slate-900 text-white h-12 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-pink-600 transition-all flex items-center justify-center gap-3">
                                    <ShoppingBag size={16} /> Ajouter au Panier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <SimilarProducts currentProductId={product.id} currentGroup={groupLabel} />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.swiper-button-next, .swiper-button-prev { color: black !important; background: white; width: 30px; height: 30px; border-radius: 50%; scale: 0.6; box-shadow: 0 2px 10px rgba(0,0,0,0.1); } .swiper-slide-thumb-active { border-color: #db2777 !important; opacity: 1 !important; }` }} />
        </div>
    );
};

export default ProductDetails;

