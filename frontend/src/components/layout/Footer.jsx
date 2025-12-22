import React from 'react';
import { Truck, Headphones, CreditCard, Instagram, Facebook, Twitter, Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <>
            {/* === PARTIE 1 : RÉASSURANCE (ROSE) === 
        C'est cette partie qui "glisse" par-dessus le footer noir.
        L'astuce est le 'mb-[...]' qui laisse de la place pour le footer fixe en dessous.
        Le 'z-10' et 'relative' assurent qu'il passe PAR DESSUS le noir.
      */}
            <section className="relative z-10 bg-[#ffecf5] pt-20 pb-24 rounded-b-[50px] shadow-xl mb-[580px] md:mb-[400px]">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-pink-200/50">

                        {/* Livraison */}
                        <div className="flex flex-col items-center gap-4 p-4">
                            <Truck size={32} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-lg font-light text-slate-900 uppercase tracking-widest mb-2">Livraison Gratuite</h3>
                                <p className="text-sm text-slate-500 font-light">Dès 5000 FCFA partout à Abidjan et dès 2000 F CFA à Abengourou.</p>
                            </div>
                        </div>

                        {/* SAV */}
                        <div className="flex flex-col items-center gap-4 p-4">
                            <Headphones size={32} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-lg font-light text-slate-900 uppercase tracking-widest mb-2">Service Client</h3>
                                <p className="text-sm text-slate-500 font-light">Dispo 7j/7 par WhatsApp & Email</p>
                            </div>
                        </div>

                        {/* Paiement */}
                        <div className="flex flex-col items-center gap-4 p-4">
                            <CreditCard size={32} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-lg font-light text-slate-900 uppercase tracking-widest mb-2">Paiement Sécurisé</h3>
                                <p className="text-sm text-slate-500 font-light">Wave, Orange Money, MTN Money, Moov Money, PayPal, Carte Bancaire</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* === PARTIE 2 : FOOTER (NOIR) === 
        Il est fixé en bas ('fixed bottom-0') et reste derrière ('-z-10').
        Il ne bouge pas, c'est le contenu au-dessus qui bouge.
      */}
            <footer className="fixed bottom-0 left-0 w-full bg-black text-white py-16 -z-10 h-[580px] md:h-[400px] flex flex-col justify-center">
                <div className="container mx-auto px-6">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                        {/* Colonne 1 : Boutique */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-pink-200">Boutique</h4>
                            <ul className="space-y-3 text-sm text-gray-400 font-light">
                                <li><a href="/#sacs" className="hover:text-white transition-colors">Sacs de luxe</a></li>
                                <li><a href="/#chaussures" className="hover:text-white transition-colors">Chaussures</a></li>
                                <li><a href="/#accessoires" className="hover:text-white transition-colors">Accessoires</a></li>
                                <li><a href="/" className="hover:text-white transition-colors">Nouveautés</a></li>
                            </ul>
                        </div>

                        {/* Colonne 2 : Légal */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-pink-200">Légal</h4>
                            <ul className="space-y-3 text-sm text-gray-400 font-light">
                                <li><a href="#" className="hover:text-white transition-colors">Mentions Légales</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">CGV</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                            </ul>
                        </div>

                        {/* Colonne 3 : Aide */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-pink-200">Aide</h4>
                            <ul className="space-y-3 text-sm text-gray-400 font-light">
                                <li><a href="#" className="hover:text-white transition-colors">Suivre ma commande</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Retours & Échanges</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        {/* Colonne 4 : Newsletter */}
                        <div>
                            <h4 className="font-bold text-lg uppercase tracking-widest mb-2">Newsletter</h4>
                            <p className="text-gray-400 text-sm mb-4 font-light">Inscrivez-vous pour recevoir nos offres exclusives.</p>

                            <form className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    placeholder="Votre email"
                                    className="bg-transparent border border-gray-700 text-white p-3 rounded-none focus:border-pink-500 outline-none text-sm transition-colors"
                                />
                                <button className="bg-white text-black py-3 px-6 font-bold text-sm tracking-widest hover:bg-pink-200 transition-colors uppercase">
                                    Je m'inscris
                                </button>
                            </form>
                        </div>

                    </div>

                    {/* Bas de page : Copyright & Paiement */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">

                        <div className="flex gap-6">
                            <a href="#" className="text-white hover:text-pink-400"><Instagram size={20} /></a>
                            <a href="#" className="text-white hover:text-pink-400"><Facebook size={20} /></a>
                            <a href="#" className="text-white hover:text-pink-400"><Twitter size={20} /></a>
                        </div>

                        <p className="text-gray-600 text-xs font-light">© 2025 TKB, Tous droits réservés. Réalisé avec passion.</p>

                        <div className="flex gap-3 text-gray-500">
                            {/* Simulation de logos de paiement avec des icônes */}
                            <CreditCard size={24} />
                            <div className="font-bold text-xs border border-gray-600 px-1 rounded flex items-center">VISA</div>
                            <div className="font-bold text-xs border border-gray-600 px-1 rounded flex items-center">OM</div>
                            <div className="font-bold text-xs border border-gray-600 px-1 rounded flex items-center">Wave</div>
                            <div className="font-bold text-xs border border-gray-600 px-1 rounded flex items-center">MoMo</div>
                        </div>

                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;