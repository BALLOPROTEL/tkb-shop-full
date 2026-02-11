import React, { useState } from 'react';
import { X, Loader, CheckCircle, Smartphone, CreditCard } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onSuccess, amount }) {
    const [step, setStep] = useState(1); // 1:Choix, 2:Saisie, 3:Chargement, 4:Succès
    const [method, setMethod] = useState('');

    if (!isOpen) return null;

    const startPayment = () => {
        setStep(3);
        setTimeout(() => {
            setStep(4);
            setTimeout(() => onSuccess(), 1500);
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                    <h3 className="font-serif text-lg tracking-tight">Paiement Sécurisé</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-6">
                            <p className="text-center text-slate-400 text-sm">Total à régler : <span className="text-slate-900 font-bold">{amount.toLocaleString()} F CFA</span></p>
                            <div className="grid grid-cols-2 gap-4">
                                {['Orange Money', 'Wave', 'MTN Money', 'Carte Visa'].map(m => (
                                    <button key={m} onClick={() => { setMethod(m); setStep(2); }} className="p-6 border border-slate-100 rounded-3xl hover:border-pink-200 hover:bg-pink-50 transition-all flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold">{m[0]}</div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{m}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Numéro {method}</label>
                                <input type="tel" placeholder="00 00 00 00 00" className="w-full p-5 bg-slate-50 rounded-2xl text-xl font-bold tracking-[0.3em] outline-none focus:ring-2 ring-blue-100" />
                            </div>
                            <button onClick={startPayment} className="w-full bg-green-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-green-100">Confirmer {amount.toLocaleString()} F</button>
                            <button onClick={() => setStep(1)} className="w-full text-xs text-slate-400 underline">Retour</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-10 space-y-4">
                            <Loader size={40} className="animate-spin text-blue-500 mx-auto" />
                            <p className="font-bold">Validation en cours...</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="text-green-600" size={32} /></div>
                            <h3 className="text-2xl font-serif">Merci !</h3>
                            <p className="text-sm text-slate-400">Commande validée avec succès.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}