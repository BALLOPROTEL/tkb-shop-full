import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ici, plus tard, on pourra relier ça au Backend pour recevoir un vrai mail.
        // Pour l'instant, on simule.
        toast.success("Message envoyé ! Nous vous répondrons sous 24h.");
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6">
            <div className="max-w-5xl mx-auto">

                <div className="text-center mb-12">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Contactez-nous</h1>
                    <p className="text-slate-500">Une question ? Un problème ? Notre équipe est là pour vous.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* INFO BOX */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Nos Coordonnées</h2>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center"><Phone size={20} /></div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold">Téléphone</p>
                                        <p className="font-bold text-lg">+225 07 07 00 00 00</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center"><Mail size={20} /></div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold">Email</p>
                                        <p className="font-bold text-lg">contact@tkb-shop.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center"><MapPin size={20} /></div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold">Adresse</p>
                                        <p className="font-bold text-lg">Abidjan, Côte d'Ivoire</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-700">
                            <p className="mb-4 font-bold">Support direct :</p>
                            <a href="https://wa.me/2250707000000" target="_blank" className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors">
                                <MessageCircle size={20} /> Discuter sur WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* FORMULAIRE */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Votre Nom</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Jean Dupont" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Votre Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" placeholder="jean@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Votre Message</label>
                                <textarea required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 h-32 resize-none" placeholder="Comment puis-je..."></textarea>
                            </div>
                            <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                                <Send size={18} /> Envoyer le message
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Contact;