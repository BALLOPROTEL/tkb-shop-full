import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { MapPin, Phone, CreditCard, CheckCircle, ArrowLeft, Loader, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentModal from '../components/common/PaymentModal';
import { API_BASE_URL } from '../config';
// 👇 1. On importe la fenêtre de connexion
import AuthModal from '../components/auth/AuthModal';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // 👇 2. État pour ouvrir la connexion directement ici
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [formData, setFormData] = useState({
        address: '', city: '', phone: '', paymentMethod: 'online'
    });

    const shippingCost = cartTotal > 100000 ? 0 : 2000;
    const finalTotal = cartTotal + shippingCost;
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (cart.length === 0 && !isSuccess) navigate('/');
    }, [cart, isSuccess, navigate]);

    // --- GESTION UTILISATEUR NON CONNECTÉ ---
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg text-center border border-slate-100">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="text-pink-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Connexion requise</h2>
                    <p className="text-slate-500 mb-8">
                        Pour sécuriser votre commande et suivre votre colis, vous devez être identifié.
                    </p>

                    {/* 👇 3. BOUTON QUI OUVRE LA FENÊTRE AU LIEU DE REDIRIGER */}
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                    >
                        Se connecter maintenant
                    </button>

                    {/* 👇 4. INTÉGRATION DU MODAL JUSTE POUR CETTE PAGE */}
                    <AuthModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                        initialMode="login"
                    />
                </div>
            </div>
        );
    }

    // ... (Le reste du code reste IDENTIQUE à avant) ...

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        setLoading(true);

        try {
            const transactionId = "TX-" + Math.floor(Math.random() * 100000000);
            const userId = user.id || user._id;

            if (!userId) throw new Error("ID Utilisateur introuvable");

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
                        status: 'Payé (Mobile Money)',
                        paymentId: transactionId
                    })
                });
            });

            await Promise.all(orderPromises);

            setIsSuccess(true);
            clearCart();
            toast.success("Commande validée ! 🎉");
            navigate('/payment-success');

        } catch (err) {
            console.error(err);
            toast.error("Erreur d'enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentClick = () => {
        if (!formData.address || !formData.city || !formData.phone) {
            toast.error("Veuillez remplir l'adresse et le téléphone");
            return;
        }
        setShowPaymentModal(true);
    };

    if (cart.length === 0 && !isSuccess) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">

                <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-slate-500 mb-8 hover:text-slate-900">
                    <ArrowLeft size={20} /> Retour au panier
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                    <CheckCircle className="text-green-500" /> Paiement Sécurisé
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* GAUCHE : FORMULAIRE */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Livraison</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse complète</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input required type="text" placeholder="Quartier, Rue..."
                                        className="w-full pl-10 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                                <input required type="text" placeholder="Abidjan..."
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input required type="tel" placeholder="07 07 00 00 00"
                                        className="w-full pl-10 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-3">Moyen de paiement</label>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-sm text-slate-500 mb-3">Paiement Mobile & Carte</p>
                                    <div className="flex justify-center items-center gap-4 flex-wrap opacity-80">
                                        <span className="font-bold text-orange-500">OM</span>
                                        <span className="font-bold text-yellow-500">MTN</span>
                                        <span className="font-bold text-cyan-500">Wave</span>
                                        <span className="font-bold text-slate-700">VISA</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePaymentClick}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl mt-6 hover:bg-green-500 shadow-xl shadow-green-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                            >
                                Payer {finalTotal.toLocaleString()} F maintenant
                            </button>
                        </div>
                    </div>

                    {/* DROITE : RÉCAP */}
                    <div className="bg-slate-100 p-8 rounded-3xl h-fit border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Récapitulatif</h3>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0">
                                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-slate-500">Qté: {item.quantity}</p>
                                    </div>
                                    <p className="font-bold text-slate-700">{(item.price * item.quantity).toLocaleString()} F</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-200 mt-6 pt-4 space-y-2">
                            <div className="flex justify-between text-slate-600">
                                <span>Sous-total</span>
                                <span>{cartTotal.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Livraison</span>
                                <span>{shippingCost.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between text-xl font-extrabold text-slate-900 pt-2">
                                <span>Total à payer</span>
                                <span>{finalTotal.toLocaleString()} F</span>
                            </div>
                        </div>
                    </div>

                </div>

                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={finalTotal}
                />

            </div>
        </div>
    );
};

export default Checkout;