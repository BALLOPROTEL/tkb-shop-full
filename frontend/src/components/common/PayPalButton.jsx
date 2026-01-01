import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const PayPalButton = ({ amount, onSuccess }) => {
    const paypalRef = useRef();

    // Conversion FCFA -> EUR
    const amountInEuro = (amount / 655).toFixed(2);

    useEffect(() => {
        // 1. NETTOYAGE : On vide le conteneur avant de rendre les boutons
        // Cela évite que les boutons ne s'accumulent à chaque rafraîchissement
        if (paypalRef.current) {
            paypalRef.current.innerHTML = "";
        }

        // 2. RENDU DES BOUTONS
        if (window.paypal) {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                currency_code: "EUR",
                                value: amountInEuro
                            }
                        }]
                    });
                },
                onApprove: async (data, actions) => {
                    const order = await actions.order.capture();
                    toast.success("Paiement PayPal validé !");
                    onSuccess(order.id);
                },
                onError: (err) => {
                    console.error("Erreur PayPal :", err);
                    toast.error("Échec du paiement PayPal.");
                },
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal'
                }
            }).render(paypalRef.current);
        }
    }, [amountInEuro, onSuccess]); // S'exécute si le montant change

    return (
        <div className="mt-6">
            <p className="text-xs text-slate-500 mb-2 text-center">Paiement international sécurisé via PayPal</p>
            <div ref={paypalRef} id="paypal-button-container"></div>
        </div>
    );
};

export default PayPalButton;