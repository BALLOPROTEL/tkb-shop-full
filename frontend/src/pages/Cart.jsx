import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getStoredUser } from '../utils/authStorage';
import { toast } from 'react-hot-toast';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();
    const user = getStoredUser();

    const shippingThreshold = 50000;
    const shippingCost = cartTotal >= shippingThreshold ? 0 : 5000;
    const finalTotal = cartTotal + shippingCost;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 pt-32 text-center">
                <ShoppingBag size={80} strokeWidth={1} className="text-pink-100 mb-8" />
                <h2 className="text-3xl font-serif text-slate-900 mb-6">Votre sélection est vide</h2>
                <Link to="/" className="bg-slate-900 text-white px-12 py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-pink-600 transition-all">Découvrir la collection</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
                <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 mb-12 border-b border-pink-50 pb-8">Sélection Privée</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                    <div className="lg:col-span-2 space-y-10">
                        {cart.map((item) => (
                            <div key={`${item.id}-${item.selectedSize}-${item.selectedColor || 'no-color'}`} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center border-b border-gray-50 pb-10">
                                <img src={item.image} alt={item.name} className="w-20 sm:w-24 aspect-[3/4] object-cover bg-slate-50 rounded-lg" />
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-serif text-lg text-slate-900">{item.name}</h3>
                                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Taille: {item.selectedSize || 'Unique'}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex items-center border border-slate-100 rounded-full">
                                            <button onClick={() => updateQuantity(item.id, item.selectedSize, -1, item.selectedColor)} className="p-2 px-3 text-slate-400 hover:text-slate-900"><Minus size={12} /></button>
                                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.selectedSize, 1, item.selectedColor)} className="p-2 px-3 text-slate-400 hover:text-slate-900"><Plus size={12} /></button>
                                        </div>
                                        <p className="font-bold text-slate-900">{(item.price * item.quantity).toLocaleString()} F</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#fcfaf7] p-6 sm:p-10 rounded-3xl h-fit lg:sticky lg:top-40 space-y-8 shadow-sm border border-pink-50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-center border-b border-pink-100 pb-4">Résumé</h3>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex justify-between text-slate-400"><span>Sous-total</span><span className="text-slate-900">{cartTotal.toLocaleString()} F</span></div>
                            <div className="flex justify-between text-slate-400"><span>Livraison</span><span className="text-slate-900">{shippingCost === 0 ? "GRATUIT" : `${shippingCost.toLocaleString()} F`}</span></div>
                            <div className="flex justify-between items-center pt-6 border-t border-pink-100 text-xl font-serif"><span>Total</span><span className="text-pink-600">{finalTotal.toLocaleString()} F CFA</span></div>
                        </div>
                        <button onClick={() => user ? navigate('/checkout') : toast.error("Identifiez-vous d'abord")} className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-600 transition-all shadow-xl shadow-slate-200">Passer à la caisse</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

