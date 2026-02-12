import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, ArrowRight, Gift, Star, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: 'CI',
        phone: '',
        acceptTerms: false,
        acceptSalesPolicy: false,
        acceptMarketing: false,
        acceptOrderTracking: false,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!formData.acceptTerms || !formData.acceptSalesPolicy) {
            toast.error("Veuillez accepter les conditions et la politique de vente.");
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/api/auth/register', {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                password: formData.password,
            });
            toast.success("Compte cree ! Connectez-vous.");
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Erreur d'inscription";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const countries = useMemo(() => {
        try {
            const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
                ? new Intl.DisplayNames(['fr'], { type: 'region' })
                : null;
            const codes = getCountries();
            const toFlag = (code) => code
                .toUpperCase()
                .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

            return codes
                .map((code) => {
                    const name = displayNames?.of(code) || code;
                    const dial = `+${getCountryCallingCode(code)}`;
                    return { code, name, dial, flag: toFlag(code) };
                })
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        } catch (e) {
            return [
                { code: 'CI', name: "Cote d'Ivoire", dial: '+225', flag: '🇨🇮' },
                { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
                { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
            ];
        }
    }, []);

    return (
        <section className="relative min-h-screen bg-[#f7f2ec] text-slate-900 pt-28 pb-20 overflow-hidden">
            <div className="absolute -top-24 left-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-slate-900/10 blur-3xl rounded-full animate-float-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)] opacity-70" />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-stretch">
                    {/* LEFT: Form */}
                    <div className="w-full lg:flex-1 min-w-0 bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 lg:p-12 animate-fade-up">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">Creer un compte</h1>
                            <Link to="/login" className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500 hover:text-slate-900">
                                Se connecter
                            </Link>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Rejoignez TKB et profitez d'une experience exclusive.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                        Prenom*
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Prenom"
                                            className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                        Nom de famille*
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Nom de famille"
                                            className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Adresse e-mail*
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="email@exemple.com"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Mot de passe*
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Mot de passe"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Confirmer le nouveau mot de passe*
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Confirmer le mot de passe"
                                        className="w-full pl-10 pr-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">
                                    Numero de telephone
                                </label>
                                <div className="grid grid-cols-[1fr_1fr] gap-3">
                                    <select
                                        className="w-full px-3 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    >
                                        {countries.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name} ({c.dial})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        placeholder="07 00 00 00 00"
                                        className="w-full px-4 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 text-xs text-slate-600">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-slate-900"
                                        checked={formData.acceptTerms}
                                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                    />
                                    <span>
                                        En cochant cette case, j'accepte les Conditions generales et la Declaration de confidentialite.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-slate-900"
                                        checked={formData.acceptSalesPolicy}
                                        onChange={(e) => setFormData({ ...formData, acceptSalesPolicy: e.target.checked })}
                                    />
                                    <span>
                                        J'accepte la politique de vente de TKB SHOP.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-slate-900"
                                        checked={formData.acceptMarketing}
                                        onChange={(e) => setFormData({ ...formData, acceptMarketing: e.target.checked })}
                                    />
                                    <span>
                                        Oui, je souhaite recevoir des offres et actualites par email (optionnel).
                                    </span>
                                </label>
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-slate-900"
                                        checked={formData.acceptOrderTracking}
                                        onChange={(e) => setFormData({ ...formData, acceptOrderTracking: e.target.checked })}
                                    />
                                    <span>
                                        J'accepte le suivi de commande par email/SMS.
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-3 uppercase tracking-[0.35em] text-[11px] font-black hover:bg-pink-600 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? '...' : 'Creer un compte'} <ArrowRight size={14} />
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: Benefits */}
                    <div className="w-full lg:flex-1 min-w-0 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-fade-up">
                        <div className="relative h-full">
                            <img
                                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop"
                                alt="TKB VIP"
                                className="w-full h-64 sm:h-72 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
                            <div className="relative p-8 sm:p-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-300 text-[10px] uppercase tracking-[0.3em] font-bold">
                                    <Sparkles size={12} /> TKB VIP
                                </div>
                                <h2 className="mt-4 text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em]">
                                    Avantages exclusifs
                                </h2>
                                <p className="mt-3 text-sm text-slate-600">
                                    Des cadeaux, des avant-premieres et une experience personnalisee.
                                </p>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                                    <div className="flex items-start gap-3 border border-slate-300 p-4">
                                        <Gift size={18} className="text-slate-900" />
                                        <div>
                                            <p className="font-semibold uppercase tracking-[0.2em] text-[11px]">Cadeau bienvenue</p>
                                            <p className="text-xs text-slate-500">Une surprise pour votre premiere commande.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 border border-slate-300 p-4">
                                        <Star size={18} className="text-slate-900" />
                                        <div>
                                            <p className="font-semibold uppercase tracking-[0.2em] text-[11px]">Avant-premieres</p>
                                            <p className="text-xs text-slate-500">Acces prioritaire aux nouveautes.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 border border-slate-300 p-4">
                                        <Zap size={18} className="text-slate-900" />
                                        <div>
                                            <p className="font-semibold uppercase tracking-[0.2em] text-[11px]">Paiement rapide</p>
                                            <p className="text-xs text-slate-500">Checkout accelere et sécurisé.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 border border-slate-300 p-4">
                                        <ShieldCheck size={18} className="text-slate-900" />
                                        <div>
                                            <p className="font-semibold uppercase tracking-[0.2em] text-[11px]">Suivi commandes</p>
                                            <p className="text-xs text-slate-500">Notifications en temps reel.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 text-xs text-slate-500">
                                    En creant un compte, vous acceptez nos conditions et notre politique de confidentialite.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suivre ma commande */}
                <div className="mt-12 bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h3 className="text-lg sm:text-xl font-serif uppercase tracking-[0.2em]">Consulter le statut de votre commande</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Entrez votre numero de commande et votre email pour suivre votre livraison.
                    </p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                        <input
                            type="text"
                            placeholder="Numero de commande"
                            className="w-full px-4 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-slate-300 bg-white focus:border-slate-900 outline-none"
                        />
                        <button
                            type="button"
                            className="px-6 py-3 bg-slate-900 text-white uppercase tracking-[0.3em] text-[11px] font-black hover:bg-pink-600 transition-all"
                        >
                            Verifier
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;
