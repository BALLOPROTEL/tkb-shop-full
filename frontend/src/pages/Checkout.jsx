import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CreditCard, ShieldCheck, Loader2, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const PAYPAL_CURRENCY = import.meta.env.VITE_PAYPAL_CURRENCY || "EUR";
const PAYPAL_FX_RATE = Number(import.meta.env.VITE_PAYPAL_FX_RATE || 655);

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({ fullName: '', street: '', city: '', phone: '' });
    const [serverTotal, setServerTotal] = useState(null);
    const isAddressValid = address.fullName && address.street && address.city && address.phone;
    const fetchQuote = async () => {
        try {
            const res = await api.post('/api/orders/quote', {
                items: cart.map(i => ({
                    product: String(i.id),
                    quantity: i.quantity,
                    size: i.selectedSize || "Unique"
                }))
            });
            const total = res?.data?.totalAmount;
            if (typeof total === 'number') {
                setServerTotal(total);
                return total;
            }
        } catch (err) {
            console.error("Erreur quote:", err.response?.data || err.message);
            toast.error("Impossible de valider le panier");
        } finally {
        }
        return null;
    };


    const handleStripePayment = async () => {
        if (!isAddressValid) {
            return toast.error("Veuillez remplir Nom, Adresse, Ville et Téléphone");
        }

        setLoading(true);
        try {
            // 1. CRÉATION COMMANDE
            const orderPayload = {
                items: cart.map(i => ({
                    product: String(i.id),
                    name: i.name,
                    quantity: i.quantity,
                    price: parseFloat(i.price),
                    image: i.image,
                    size: i.selectedSize || "Unique"
                })),
                totalAmount: parseFloat(serverTotal ?? cartTotal),
                paymentMethod: 'Stripe',
                shippingAddress: `${address.fullName}, ${address.street}, ${address.city}`,
                phone: address.phone
            };

            const orderRes = await api.post('/api/orders', orderPayload);
            const orderId = orderRes.data.id;

            // 2. CRÉATION SESSION STRIPE
            const stripeRes = await api.post('/api/payments/create-stripe-session', { orderId });

            const stripe = await stripePromise;
            await stripe.redirectToCheckout({ sessionId: stripeRes.data.id });

        } catch (err) {
            console.error("Erreur détaillée:", err.response?.data || err.message);
            toast.error("Erreur d'initialisation du paiement Stripe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* LIVRAISON */}
                    <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                        <h2 className="text-3xl font-serif flex items-center gap-3">
                            <MapPin className="text-pink-400" /> Livraison
                        </h2>
                        <div className="space-y-6">
                            <input type="text" placeholder="Nom complet" className="w-full border-b p-4 outline-none focus:border-pink-500 bg-pink-50/10"
                                onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                            <input type="text" placeholder="Adresse complète" className="w-full border-b p-4 outline-none focus:border-pink-500 bg-pink-50/10"
                                onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Ville" className="w-full border-b p-4 outline-none focus:border-pink-500 bg-pink-50/10"
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                                <input type="text" placeholder="Téléphone" className="w-full border-b p-4 outline-none focus:border-pink-500 bg-pink-50/10"
                                    onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* RÉCAPITULATIF & PAIEMENT */}
                    <div className="bg-slate-50 p-8 rounded-3xl space-y-8 h-fit shadow-sm animate-in fade-in slide-in-from-right duration-700">
                        <div className="flex justify-between items-end border-b pb-4">
                            <span className="text-sm text-slate-500 uppercase font-bold tracking-widest">Total à régler</span>
                            <span className="text-2xl font-serif text-pink-600">{(serverTotal ?? cartTotal).toLocaleString()} F CFA</span>
                        </div>

                        <button onClick={handleStripePayment} disabled={loading}
                            className="w-full bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center hover:bg-pink-600 transition-all shadow-xl">
                            <span className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                                <CreditCard size={18} /> Payer par Carte
                            </span>
                            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                        </button>

                        <div className="relative text-center py-2">
                            <span className="bg-slate-50 px-4 text-[9px] uppercase text-slate-400 relative z-10 font-bold">Ou utiliser PayPal</span>
                            <div className="absolute top-1/2 left-0 w-full border-t border-slate-200"></div>
                        </div>

                        <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: PAYPAL_CURRENCY }}>
                            <PayPalButtons
                                style={{ layout: "vertical", shape: "pill" }}
                                onClick={(data, actions) => {
                                    if (!isAddressValid) {
                                        toast.error("Veuillez remplir Nom, Adresse, Ville et Téléphone");
                                        return actions.reject();
                                    }
                                    return actions.resolve();
                                }}
                                createOrder={(data, actions) => {
                                    return fetchQuote().then((total) => {
                                        const amount = total ?? cartTotal;
                                        return actions.order.create({
                                            purchase_units: [{ amount: { value: (amount / PAYPAL_FX_RATE).toFixed(2) } }]
                                        });
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    const order = await actions.order.capture();
                                    await api.post('/api/orders', {
                                        items: cart.map(i => ({ product: i.id, name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
                                        totalAmount: serverTotal ?? cartTotal,
                                        paymentMethod: 'PayPal',
                                        paymentId: order?.id || data.orderID,
                                        status: 'Payé',
                                        shippingAddress: `${address.fullName}, ${address.street}, ${address.city}`,
                                        phone: address.phone
                                    });
                                    clearCart();
                                    navigate('/payment-success');
                                }}
                                onError={() => toast.error("Échec du paiement PayPal")}
                            />
                        </PayPalScriptProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
