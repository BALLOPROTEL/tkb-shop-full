import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function PayPalButton({ amount, onSuccess }) {
    const paypalRef = useRef();
    const amountInEuro = (amount / 655).toFixed(2);

    useEffect(() => {
        if (!window.paypal) return;

        // Nettoyage impératif pour React 18
        if (paypalRef.current) paypalRef.current.innerHTML = "";

        window.paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{ amount: { currency_code: "EUR", value: amountInEuro } }]
                });
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                toast.success("Validation PayPal réussie");
                onSuccess(order.id);
            },
            onError: (err) => {
                console.error(err);
                toast.error("Échec du service PayPal");
            }
        }).render(paypalRef.current);
    }, [amountInEuro, onSuccess]);

    return (
        <div className="w-full min-h-[150px]">
            <div ref={paypalRef} className="z-10 relative"></div>
        </div>
    );
}