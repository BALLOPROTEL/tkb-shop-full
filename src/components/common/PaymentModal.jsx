import React, { useState } from 'react';
import { X, Loader, CheckCircle, Smartphone, CreditCard } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onSuccess, amount }) => {
    const [step, setStep] = useState(1); // 1: Choix, 2: Saisie, 3: Chargement, 4: Succès
    const [method, setMethod] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    if (!isOpen) return null;

    const handleMethodSelect = (selectedMethod) => {
        setMethod(selectedMethod);
        setStep(2);
    };

    const handlePay = () => {
        setStep(3); // Affiche le loader

        // On simule un délai réseau de 3 secondes (comme une vraie banque)
        setTimeout(() => {
            setStep(4); // Succès
            // Après 1 seconde de succès, on ferme et on valide la commande
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="bg-green-500 p-1 rounded-full w-2 h-2"></span> Paiement Sécurisé
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                {/* Contenu Changeant selon l'étape */}
                <div className="p-8">

                    {/* ÉTAPE 1 : CHOIX */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-center text-slate-500 mb-4">Montant à payer : <span className="text-slate-900 font-bold">{amount.toLocaleString()} F CFA</span></p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleMethodSelect('Orange Money')} className="p-4 border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">OM</div>
                                    <span className="font-bold text-sm text-slate-700">Orange Money</span>
                                </button>
                                <button onClick={() => handleMethodSelect('Wave')} className="p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs">W</div>
                                    <span className="font-bold text-sm text-slate-700">Wave</span>
                                </button>
                                <button onClick={() => handleMethodSelect('MTN Money')} className="p-4 border border-slate-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xs">MTN</div>
                                    <span className="font-bold text-sm text-slate-700">MTN Money</span>
                                </button>
                                <button onClick={() => handleMethodSelect('Carte Bancaire')} className="p-4 border border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all flex flex-col items-center gap-2">
                                    <CreditCard className="w-10 h-10 text-slate-700" />
                                    <span className="font-bold text-sm text-slate-700">Carte Visa</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 2 : SAISIE TÉLÉPHONE */}
                    {step === 2 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-right">
                            <div className="text-left">
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Numéro {method}</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        type="tel"
                                        autoFocus
                                        placeholder="07 00 00 00 00"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full pl-12 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-lg tracking-widest"
                                    />
                                </div>
                            </div>
                            <button onClick={handlePay} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-500 shadow-xl shadow-green-200 transition-all">
                                Confirmer le paiement
                            </button>
                            <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-slate-600 underline">Changer de méthode</button>
                        </div>
                    )}

                    {/* ÉTAPE 3 : CHARGEMENT */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in">
                            <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Traitement en cours...</h3>
                            <p className="text-slate-500">Veuillez valider sur votre téléphone.</p>
                        </div>
                    )}

                    {/* ÉTAPE 4 : SUCCÈS */}
                    {step === 4 && (
                        <div className="text-center py-8 animate-in zoom-in">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Paiement Réussi !</h3>
                            <p className="text-slate-500">Redirection vers la boutique...</p>
                        </div>
                    )}

                </div>

                {/* Footer Secure */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                        🔒 Cryptage SSL 256-bits • Powered by ProtelPay
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;