import React from 'react';
import { useLocation } from 'react-router-dom';

const LegalPage = () => {
    const { pathname } = useLocation();

    let title = "";
    let content = "";

    if (pathname === '/mentions-legales') {
        title = "Mentions Légales";
        content = (
            <div className="space-y-4 text-slate-600">
                <p><strong>Éditeur du site :</strong> TKB SHOP</p>
                <p><strong>Siège social :</strong> Abidjan, Côte d'Ivoire</p>
                <p><strong>Directeur de la publication :</strong> SEYDOU YAGNAN</p>
                <p><strong>Hébergeur :</strong> Vercel Inc. (Frontend) & Render (Backend)</p>
                <p><strong>Contact :</strong> contact@tkb-shop.com</p>
            </div>
        );
    } else if (pathname === '/cgv') {
        title = "Conditions Générales de Vente (CGV)";
        content = (
            <div className="space-y-4 text-slate-600">
                <h3 className="font-bold text-slate-900">1. Objet</h3>
                <p>Les présentes conditions régissent les ventes par TKB SHOP.</p>
                <h3 className="font-bold text-slate-900">2. Prix</h3>
                <p>Les prix de nos produits sont indiqués en Francs CFA (XOF).</p>
                <h3 className="font-bold text-slate-900">3. Commandes</h3>
                <p>Vous pouvez passer commande sur notre site internet 24/24h.</p>
                <h3 className="font-bold text-slate-900">4. Livraison</h3>
                <p>Les produits sont livrés à l'adresse de livraison indiquée au cours du processus de commande.</p>
            </div>
        );
    } else if (pathname === '/confidentialite') {
        title = "Politique de Confidentialité";
        content = (
            <div className="space-y-4 text-slate-600">
                <p>TKB SHOP s'engage à ce que la collecte et le traitement de vos données soient conformes au règlement général sur la protection des données (RGPD).</p>
                <h3 className="font-bold text-slate-900">Données collectées</h3>
                <p>Nous collectons votre nom, email et adresse uniquement pour le traitement de vos commandes.</p>
                <h3 className="font-bold text-slate-900">Cookies</h3>
                <p>Nous utilisons des cookies pour améliorer votre expérience utilisateur (panier, connexion).</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8 border-b pb-4">{title}</h1>
                <div className="leading-relaxed">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default LegalPage;