import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, ArrowLeft, Loader, User, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import AuthModal from '../components/auth/AuthModal';
import PayPalButton from '../components/common/PayPalButton';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // --- ÉTATS ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [payMode, setPayMode] = useState('kkiapay');
    const [showLoginModal, setShowLoginModal] = useState(false);

    // 👇 INITIALISATION UNIQUE (Règle le problème du texte "tkb_shop" qui revient)
    const [formData, setFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: '',
        address: '',
        city: '',
        phone: '',
        email: user?.email || ''
    });

    const shippingCost = cartTotal > 5000 ? 0 : 2000;
    const finalTotal = cartTotal + shippingCost;

    // Redirection si panier vide
    useEffect(() => {
        if (cart.length === 0) navigate('/');
    }, [cart, navigate]);

    // --- LOGIQUE DE PAIEMENT ---
    const handleKkiapay = () => {
        if (!formData.address || !formData.phone) return toast.error("Veuillez remplir les informations de livraison");

        window.openKkiapayWidget({
            amount: finalTotal,
            position: "center",
            callback: "/payment-success",
            data: "Commande TKB Shop",
            theme: "#000000",
            sandbox: true, // METTRE FALSE EN PROD
            key: "e258b7a0e01711f08e42450b5f9eeaf9", // TA CLÉ PUBLIQUE (PK)
        });

        window.addKkiapayListener('success', (response) => {
            saveOrder(response.transactionId);
        });
    };

    const saveOrder = async (transactionId) => {
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const orderPromises = cart.map(item => {
                return fetch(`${API_BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        productId: item.id,
                        productName: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        totalPrice: item.price * item.quantity,
                        address: `${formData.address}, ${formData.city} (Tél: ${formData.phone})`,
                        status: 'Payé',
                        paymentId: transactionId
                    })
                });
            });
            await Promise.all(orderPromises);
            clearCart();
            toast.success("Commande réussie !");
            navigate('/payment-success');
        } catch (err) {
            toast.error("Erreur d'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white pt-40 flex flex-col items-center p-6 text-center">
                <User size={48} className="text-slate-200 mb-4" />
                <h2 className="text-2xl font-serif mb-6 uppercase tracking-widest">Connexion requise</h2>
                <button onClick={() => setShowLoginModal(true)} className="px-12 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest">Se Connecter</button>
                <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} initialMode="login" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pt-28 pb-20">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* ÉTAPES STYLE MK */}
                <div className="flex flex-col items-center mb-16 border-b border-slate-100 pb-8">
                    <h1 className="text-2xl font-serif tracking-[0.2em] uppercase mb-6">Finaliser l'achat</h1>
                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                        <span className={step === 1 ? "border-b-2 border-black pb-1" : "text-slate-400"}>1. Expédition</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className={step === 2 ? "border-b-2 border-black pb-1" : "text-slate-400"}>2. Paiement</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* GAUCHE : FORMULAIRE */}
                    <div className="lg:col-span-7">
                        {step === 1 ? (
                            <div className="animate-in fade-in duration-500">
                                <h2 className="text-sm font-bold uppercase mb-8 tracking-widest">Adresse d'expédition</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <input type="text" placeholder="PRÉNOM" className="border-b border-slate-200 py-3 outline-none focus:border-black text-sm uppercase" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                    <input type="text" placeholder="NOM DE FAMILLE" className="border-b border-slate-200 py-3 outline-none focus:border-black text-sm uppercase" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                    <input type="text" placeholder="ADRESSE COMPLÈTE" className="md:col-span-2 border-b border-slate-200 py-3 outline-none focus:border-black text-sm uppercase" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    <input type="text" placeholder="VILLE" className="border-b border-slate-200 py-3 outline-none focus:border-black text-sm uppercase" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    <input type="tel" placeholder="NUMÉRO DE TÉLÉPHONE" className="border-b border-slate-200 py-3 outline-none focus:border-black text-sm uppercase" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <button onClick={() => setStep(2)} className="w-full bg-black text-white font-bold py-5 mt-12 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all">
                                    Continuer vers le paiement
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                <h2 className="text-sm font-bold uppercase mb-8 tracking-widest flex items-center gap-2">
                                    <Lock size={14} /> Mode de règlement
                                </h2>
                                <div className="space-y-4">
                                    <div onClick={() => setPayMode('kkiapay')} className={`p-5 border cursor-pointer flex items-center gap-4 transition-all ${payMode === 'kkiapay' ? 'border-black bg-slate-50' : 'border-slate-100'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${payMode === 'kkiapay' ? 'border-black' : 'border-slate-300'}`}>
                                            {payMode === 'kkiapay' && <div className="w-2 h-2 bg-black rounded-full" />}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Mobile Money / Carte (Afrique)</span>
                                    </div>
                                    <div onClick={() => setPayMode('paypal')} className={`p-5 border cursor-pointer flex items-center gap-4 transition-all ${payMode === 'paypal' ? 'border-black bg-slate-50' : 'border-slate-100'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${payMode === 'paypal' ? 'border-black' : 'border-slate-300'}`}>
                                            {payMode === 'paypal' && <div className="w-2 h-2 bg-black rounded-full" />}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">PayPal / International</span>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    {payMode === 'kkiapay' ? (
                                        <button onClick={handleKkiapay} className="w-full bg-black text-white font-bold py-5 uppercase tracking-[0.2em] text-[10px]">
                                            Payer maintenant
                                        </button>
                                    ) : (
                                        <PayPalButton amount={finalTotal} onSuccess={(tx) => saveOrder(tx)} />
                                    )}
                                </div>
                                <button onClick={() => setStep(1)} className="mt-8 text-[10px] font-bold uppercase underline tracking-widest flex items-center gap-2">
                                    <ArrowLeft size={12} /> Retour à l'expédition
                                </button>
                            </div>
                        )}
                    </div>

                    {/* DROITE : RÉSUMÉ (STICKY) */}
                    <div className="lg:col-span-5">
                        <div className="bg-slate-50 p-8 sticky top-32 border border-slate-100">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-8 border-b border-slate-200 pb-4">
                                Résumé de la commande ({cart.length})
                            </h3>
                            <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-16 h-20 bg-white border border-slate-200 shrink-0">
                                            <img src={item.images?.[0] || item.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase mb-1">{item.name}</p>
                                            <p className="text-[9px] text-slate-400 uppercase mb-2">Quantité : {item.quantity}</p>
                                            <p className="text-xs font-bold">{item.price.toLocaleString()} F CFA</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 pt-6 space-y-4 text-[11px] uppercase tracking-wider">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Sous-total</span>
                                    <span className="font-bold">{cartTotal.toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Livraison</span>
                                    <span className="font-bold">{shippingCost === 0 ? "Gratuit" : shippingCost + " F"}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black pt-4 border-t border-slate-200">
                                    <span>Total</span>
                                    <span>{finalTotal.toLocaleString()} F CFA</span>
                                </div>
                            </div>
                            <div className="mt-8 flex items-center gap-2 text-[9px] text-slate-400 uppercase tracking-[0.2em] justify-center">
                                <ShieldCheck size={12} className="text-green-500" /> Paiement sécurisé
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;