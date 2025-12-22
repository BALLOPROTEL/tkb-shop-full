import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    // Frais de livraison (Simulés : Gratuit si > 5.000 F CFA, sinon 2.000 F CFA)
    const shippingCost = cartTotal > 5000 ? 0 : 2000;
    const finalTotal = cartTotal + shippingCost;

    // Si le panier est vide
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={48} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Votre panier est vide</h2>
                    <p className="text-slate-500 mb-8">On dirait que vous n'avez pas encore trouvé votre bonheur.</p>
                    <Link to="/" className="block w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors">
                        Commencer le shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Si le panier contient des articles
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="container mx-auto px-6">

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                    <ShoppingBag className="text-blue-600" /> Mon Panier ({cart.length})
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* --- COLONNE GAUCHE : LISTE DES ARTICLES --- */}
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((item) => (
                            <div key={`${item.id}-${item.size}`} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-center">

                                {/* Image */}
                                <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Infos */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                                            <p className="text-sm text-slate-500">{item.category} {item.size && `• Taille ${item.size}`}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id, item.size)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-end mt-4">
                                        {/* Contrôle Quantité */}
                                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                                            <button onClick={() => updateQuantity(item.id, item.size, -1)} className="p-2 hover:bg-slate-200 rounded-l-lg transition-colors" disabled={item.quantity <= 1}>
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.size, 1)} className="p-2 hover:bg-slate-200 rounded-r-lg transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Prix Total Item */}
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Prix unitaire: {item.price.toLocaleString()} F CFA</p>
                                            <p className="font-bold text-blue-600 text-xl">{(item.price * item.quantity).toLocaleString()} F CFA</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mt-4">
                            <ArrowLeft size={18} /> Continuer mes achats
                        </Link>
                    </div>

                    {/* --- COLONNE DROITE : RÉSUMÉ --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 sticky top-28">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Résumé de la commande</h3>

                            <div className="space-y-4 mb-8 border-b border-slate-100 pb-8">
                                <div className="flex justify-between text-slate-600">
                                    <span>Sous-total</span>
                                    <span>{cartTotal.toLocaleString()} F CFA</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Livraison</span>
                                    <span>{shippingCost === 0 ? <span className="text-green-500 font-bold">Gratuit</span> : `${shippingCost} F CFA`}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-8">
                                <span className="text-lg font-bold text-slate-900">Total</span>
                                <span className="text-3xl font-extrabold text-blue-600">{finalTotal.toLocaleString()} F CFA</span>
                            </div>

                            {/* BOUTON COMMANDER AVEC NAVIGATION */}
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 shadow-xl shadow-blue-900/10 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                Commander <ArrowRight />
                            </button>

                            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                                🔒 Paiement 100% Sécurisé
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;