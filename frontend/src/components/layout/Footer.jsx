import React from 'react';
import { Truck, Headphones, CreditCard, Instagram, Facebook, Twitter, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <>
            <section className="relative z-10 bg-[#ffecf5] pt-12 md:pt-20 pb-16 md:pb-24 rounded-b-[30px] md:rounded-b-[50px] shadow-xl mb-[500px] md:mb-[400px]">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-pink-200/50">
                        <div className="flex flex-col items-center gap-3 p-4">
                            <Truck size={28} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-base md:text-lg font-light text-slate-900 uppercase tracking-widest mb-1">Livraison Gratuite</h3>
                                <p className="text-xs md:text-sm text-slate-500 font-light">Dès 5000 FCFA à Abidjan.</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 p-4 pt-8 md:pt-4">
                            <Headphones size={28} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-base md:text-lg font-light text-slate-900 uppercase tracking-widest mb-1">Service Client</h3>
                                <p className="text-xs md:text-sm text-slate-500 font-light">Dispo 7j/7 par WhatsApp</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 p-4 pt-8 md:pt-4">
                            <CreditCard size={28} strokeWidth={1} className="text-slate-800" />
                            <div>
                                <h3 className="text-base md:text-lg font-light text-slate-900 uppercase tracking-widest mb-1">Paiement Sécurisé</h3>
                                <p className="text-xs md:text-sm text-slate-500 font-light">Wave, OM, MoMo, PayPal, Carte</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Correction : h-auto sur mobile pour éviter que le texte ne soit coupé */}
            <footer className="fixed bottom-0 left-0 w-full bg-black text-white py-12 -z-10 h-[500px] md:h-[400px] flex flex-col justify-center overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
                        <div>
                            <h4 className="font-bold text-[10px] md:text-sm uppercase tracking-widest mb-4 text-pink-200">Boutique</h4>
                            <ul className="space-y-2 text-[10px] md:text-sm text-gray-400 font-light">
                                <li><a href="/#sacs" className="hover:text-white">Sacs de luxe</a></li>
                                <li><a href="/#chaussures" className="hover:text-white">Chaussures</a></li>
                                <li><a href="/" className="hover:text-white">Nouveautés</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[10px] md:text-sm uppercase tracking-widest mb-4 text-pink-200">Aide</h4>
                            <ul className="space-y-2 text-[10px] md:text-sm text-gray-400 font-light">
                                <li><a href="#" className="hover:text-white">Suivi</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                                <li><a href="#" className="hover:text-white">FAQ</a></li>
                            </ul>
                        </div>
                        <div className="col-span-2">
                            <h4 className="font-bold text-xs md:text-lg uppercase tracking-widest mb-2">Newsletter</h4>
                            <form className="flex flex-col gap-3 mt-4">
                                <input type="email" placeholder="Votre email" className="bg-transparent border border-gray-700 text-white p-2 md:p-3 rounded-none focus:border-pink-500 outline-none text-xs" />
                                <button className="bg-white text-black py-2 md:py-3 px-4 font-bold text-[10px] md:text-sm tracking-widest hover:bg-pink-200 uppercase transition-colors">S'inscrire</button>
                            </form>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-4">
                            <Instagram size={18} className="text-gray-400 hover:text-pink-400" />
                            <Facebook size={18} className="text-gray-400 hover:text-pink-400" />
                        </div>
                        <p className="text-gray-600 text-[9px] md:text-xs font-light text-center">© 2025 TKB Shop. Tous droits réservés.</p>
                        <div className="flex gap-2 text-gray-500 opacity-50 grayscale scale-75 md:scale-100">
                            <CreditCard size={20} />
                            <div className="font-bold text-[8px] border border-gray-600 px-1 rounded flex items-center">VISA</div>
                            <div className="font-bold text-[8px] border border-gray-600 px-1 rounded flex items-center">WAVE</div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;