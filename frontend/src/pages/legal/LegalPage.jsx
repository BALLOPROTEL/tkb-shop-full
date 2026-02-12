import React from 'react';
import { useLocation } from 'react-router-dom';

const LegalPage = () => {
    const { pathname } = useLocation();

    let title = '';
    let content = null;

    if (pathname === '/mentions-legales') {
        title = 'Mentions legales';
        content = (
            <div className="space-y-4 text-slate-600">
                <p><strong>Editeur du site :</strong> TKB SHOP</p>
                <p><strong>Siege social :</strong> Abidjan, Cote d'Ivoire</p>
                <p><strong>Directeur de la publication :</strong> SEYDOU YAGNAN</p>
                <p><strong>Hebergeur :</strong> Vercel Inc. (Frontend) & Render (Backend)</p>
                <p><strong>Contact :</strong> contact@tkb-shop.com</p>
            </div>
        );
    } else if (pathname === '/cgv') {
        title = 'Conditions generales de vente (CGV)';
        content = (
            <div className="space-y-4 text-slate-600">
                <h3 className="font-bold text-slate-900">1. Objet</h3>
                <p>Les presentes conditions regissent les ventes par TKB SHOP.</p>
                <h3 className="font-bold text-slate-900">2. Prix</h3>
                <p>Les prix de nos produits sont indiques en Francs CFA (XOF).</p>
                <h3 className="font-bold text-slate-900">3. Commandes</h3>
                <p>Vous pouvez passer commande sur notre site internet 24/24h.</p>
                <h3 className="font-bold text-slate-900">4. Livraison</h3>
                <p>Les produits sont livres a l'adresse de livraison indiquee au cours du processus de commande.</p>
            </div>
        );
    } else if (pathname === '/confidentialite') {
        title = 'Politique de confidentialite';
        content = (
            <div className="space-y-4 text-slate-600">
                <p>TKB SHOP s'engage a ce que la collecte et le traitement de vos donnees soient conformes au reglement general sur la protection des donnees (RGPD).</p>
                <h3 className="font-bold text-slate-900">Donnees collectees</h3>
                <p>Nous collectons votre nom, email et adresse uniquement pour le traitement de vos commandes.</p>
                <h3 className="font-bold text-slate-900">Cookies</h3>
                <p>Nous utilisons des cookies pour ameliorer votre experience utilisateur (panier, connexion).</p>
            </div>
        );
    } else if (pathname === '/livraison-retours') {
        title = 'Livraison & retours';
        content = (
            <div className="space-y-4 text-slate-600">
                <h3 className="font-bold text-slate-900">Delais</h3>
                <p>Les commandes sont traitees sous 24 a 72 heures selon la disponibilite.</p>
                <h3 className="font-bold text-slate-900">Livraison</h3>
                <p>La livraison est offerte des 50.000 FCFA. En dessous, des frais peuvent s'appliquer.</p>
                <h3 className="font-bold text-slate-900">Retours</h3>
                <p>Vous pouvez demander un retour dans un delai de 7 jours apres reception.</p>
            </div>
        );
    } else {
        title = 'Informations';
        content = (
            <div className="text-slate-600">
                Merci de choisir une page legale valide.
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
