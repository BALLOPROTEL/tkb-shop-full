import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, Truck, ShieldCheck, Minus, Plus, Heart, Share2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // États de sélection
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    const API_URL = "https://tkb-shop.onrender.com";

    useEffect(() => {
        fetch(`${API_URL}/api/products/${id}`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setProduct(data);
                // Pré-sélectionner la première couleur si elle existe
                if (data.colors && data.colors.length > 0) {
                    setSelectedColor(data.colors[0]);
                }
            })
            .catch(() => { toast.error("Produit introuvable"); navigate('/'); })
            .finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) return <div className="h-screen flex items-center justify-center">Chargement...</div>;
    if (!product) return null;

    // --- LOGIQUE (VRAIES DONNÉES) ---
    const isShoes = product.category === 'Chaussure';
    const isClothing = product.category === 'Vêtement';
    // Tailles simulées pour le style (car pas en DB)
    const sizes = isShoes ? [37, 38, 39, 40, 41] : ['XS', 'S', 'M', 'L', 'XL'];

    // Calcul Promo (VRAIE DB)
    const hasDiscount = product.oldPrice && product.oldPrice > product.price;
    const discount = hasDiscount
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    const handleAddToCart = () => {
        if (!selectedSize && (isShoes || isClothing)) return toast.error("Choisissez une taille !");
        // Vérif couleur si le produit en propose
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            return toast.error("Choisissez une couleur !");
        }
        addToCart({ ...product, selectedColor }, quantity, selectedSize);
    };

    return (
        <div className="bg-white min-h-screen pt-28 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-black mb-8 uppercase tracking-wide font-medium transition-colors">
                    <ArrowLeft size={16} /> Retour à la boutique
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* --- COLONNE GAUCHE : VISUEL RICHE --- */}
                    <div className="space-y-6">
                        {/* Grande Image */}
                        <div className="aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden relative group shadow-sm">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.stock === 0 && <span className="bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest shadow-md">Épuisé</span>}
                                {hasDiscount && <span className="bg-pink-600 text-white text-xs font-bold px-3 py-1 uppercase shadow-md">-{discount}%</span>}
                            </div>
                        </div>

                        {/* --- RETOUR DES MINIATURES (Style Fabeauty) --- */}
                        {/* Note: Répète l'image principale pour le style car la DB n'a qu'une image */}
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-slate-900 transition-all shadow-sm bg-slate-50">
                                    <img src={product.image} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="thumbnail" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- COLONNE DROITE : INFO & ACHAT --- */}
                    <div className="flex flex-col h-full pt-2">

                        <div className="border-b border-gray-100 pb-8 mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">{product.name}</h1>
                                <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-700 hover:text-red-500"><Heart size={24} /></button>
                            </div>

                            <div className="flex items-end gap-4 mb-6">
                                <span className="text-3xl font-bold text-pink-600">{product.price.toLocaleString()} F</span>
                                {hasDiscount && (
                                    <span className="text-xl text-slate-400 line-through mb-1 decoration-slate-300">
                                        {product.oldPrice.toLocaleString()} F
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="flex text-amber-400"><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" className="text-gray-300" /></div>
                                <span className="text-slate-500 underline underline-offset-4">(Voir les 42 avis)</span>
                            </div>
                        </div>

                        {/* Sélecteurs */}
                        <div className="space-y-8 flex-grow">

                            {/* VRAIES COULEURS (Venant de la DB, avec style "Sélection") */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-wide text-slate-900 block mb-4 flex items-center justify-between">
                                        Couleurs disponibles
                                        <span className="text-slate-400 font-normal normal-case text-xs">{product.colors.length} choix</span>
                                    </span>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map((hex) => {
                                            const isSelected = selectedColor === hex;
                                            const isWhite = hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#FFF';
                                            return (
                                                <button
                                                    key={hex}
                                                    onClick={() => setSelectedColor(hex)}
                                                    className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 ${isSelected
                                                            ? 'border-slate-900 scale-110 shadow-md' // Style si sélectionné
                                                            : 'border-transparent hover:border-gray-200 hover:scale-105' // Style si non sélectionné
                                                        }`}
                                                >
                                                    {/* La pastille de couleur intérieure */}
                                                    <span className={`w-full h-full rounded-full border flex items-center justify-center ${isWhite ? 'border-gray-200' : 'border-transparent'}`} style={{ backgroundColor: hex }}>
                                                        {isSelected && <Check size={16} className={isWhite ? 'text-slate-900' : 'text-white'} strokeWidth={3} />}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tailles */}
                            {(isShoes || isClothing) && (
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <span className="text-sm font-bold uppercase tracking-wide text-slate-900">Taille</span>
                                        <button className="text-xs text-slate-500 underline underline-offset-4 hover:text-slate-900 transition-colors">Guide des tailles</button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {sizes.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`h-12 min-w-[48px] px-4 border-2 rounded-xl text-sm font-bold transition-all duration-300 ${selectedSize === s
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 pt-6 border-t border-gray-100 mt-8">
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl w-36">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-4 text-slate-500 hover:text-slate-900 transition-colors"><Minus size={18} /></button>
                                    <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="p-4 text-slate-500 hover:text-slate-900 transition-colors"><Plus size={18} /></button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className="flex-1 bg-slate-900 text-white font-bold text-sm uppercase tracking-widest py-4 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
                                >
                                    <ShoppingBag size={20} />
                                    {product.stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
                                </button>
                            </div>
                        </div>

                        {/* Footer Réassurance */}
                        <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-gray-100 text-center">
                            <div className="flex flex-col items-center gap-2 text-xs text-slate-500 uppercase tracking-wide font-medium">
                                <div className="p-3 bg-slate-50 rounded-full text-slate-900 mb-1"><Truck size={20} strokeWidth={1.5} /></div>
                                Livraison offerte
                            </div>
                            <div className="flex flex-col items-center gap-2 text-xs text-slate-500 uppercase tracking-wide font-medium">
                                <div className="p-3 bg-slate-50 rounded-full text-slate-900 mb-1"><ShieldCheck size={20} strokeWidth={1.5} /></div>
                                Paiement Sécurisé
                            </div>
                            <div className="flex flex-col items-center gap-2 text-xs text-slate-500 uppercase tracking-wide font-medium">
                                <div className="p-3 bg-slate-50 rounded-full text-slate-900 mb-1"><Share2 size={20} strokeWidth={1.5} /></div>
                                Retours Faciles
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;