import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Wifi, Coffee, Car, Shield, ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // On utilise les jolies notifications

const OfferDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // États Réservation
    const [isBooking, setIsBooking] = useState(false);
    const [guests, setGuests] = useState(2);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // 1. CHARGEMENT DE L'OFFRE (CORRIGÉ)
    // On ne fait que charger les données ici. Pas de navigation, pas de succès.
    useEffect(() => {
        const fetchOffer = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/offers/${id}`);
                if (!res.ok) throw new Error("Offre introuvable");
                const data = await res.json();
                setOffer(data); // On met juste à jour l'affichage
            } catch (err) {
                console.error(err);
                setError("Impossible de charger cette offre.");
                toast.error("Erreur de chargement de l'offre");
            } finally {
                setLoading(false);
            }
        };
        fetchOffer();
    }, [id]);

    // 2. ACTION RÉSERVER (CORRIGÉ)
    // C'est ici que se passe la logique de réservation et la redirection
    const handleBooking = async () => {
        const userStored = localStorage.getItem('user');

        if (!userStored) {
            toast.error("Veuillez vous connecter pour réserver ! 🔒");
            return;
        }

        if (!dateStart || !dateEnd) {
            toast.error("Veuillez sélectionner vos dates ! 📅");
            return;
        }

        const user = JSON.parse(userStored);
        setIsBooking(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    offerId: offer.id,
                    offerTitle: offer.title,
                    location: offer.location,
                    price: offer.price,
                    dateStart, dateEnd, guests
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Réservation validée ! ✈️");
                // Petite pause pour voir le toast avant de changer de page
                setTimeout(() => {
                    navigate('/payment-success', {
                        state: {
                            title: offer.title,
                            location: offer.location,
                            dateStart, dateEnd, guests,
                            price: offer.price,
                            id: data.id
                        }
                    });
                }, 1000);
            } else {
                toast.error("Erreur : " + (data.detail || "Réservation impossible"));
            }
        } catch (err) {
            toast.error("Impossible de contacter le serveur 🔌");
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Chargement...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">{error}</div>;
    if (!offer) return null;

    return (
        <div className="bg-white min-h-screen pb-20 pt-24">
            {/* Header */}
            <div className="container mx-auto px-6 mb-6">
                <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-4">
                    <ChevronLeft size={20} className="mr-1" /> Retour
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-2">{offer.title}</h1>
                <div className="flex items-center text-slate-600 text-sm gap-4">
                    <span className="flex items-center"><Star size={16} className="text-yellow-500 mr-1 fill-yellow-500" /> {offer.rating}</span>
                    <span className="flex items-center"><MapPin size={16} className="mr-1" /> {offer.location}</span>
                </div>
            </div>

            {/* Image */}
            <div className="container mx-auto px-6 mb-12">
                <div className="h-[400px] rounded-3xl overflow-hidden shadow-2xl relative bg-slate-200">
                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Détails */}
            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">À propos</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">{offer.description || "Aucune description."}</p>
                    </section>
                    <hr className="border-slate-100" />
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Équipements</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-slate-700"><Wifi className="text-slate-400" /><span className="font-medium">Wi-Fi</span></div>
                            <div className="flex items-center gap-3 text-slate-700"><Coffee className="text-slate-400" /><span className="font-medium">Petit-déjeuner</span></div>
                            <div className="flex items-center gap-3 text-slate-700"><Car className="text-slate-400" /><span className="font-medium">Parking</span></div>
                            <div className="flex items-center gap-3 text-slate-700"><Shield className="text-slate-400" /><span className="font-medium">Sécurité</span></div>
                        </div>
                    </section>
                </div>

                {/* Widget Réservation */}
                <div className="relative">
                    <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
                        <div className="mb-6"><span className="text-3xl font-bold text-slate-900">{offer.price}€</span><span className="text-slate-500"> / nuit</span></div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                            <div className="flex border-b border-slate-200">
                                <div className="w-1/2 p-3 border-r"><label className="block text-xs font-bold text-slate-500 uppercase">Début</label><input type="date" onChange={(e) => setDateStart(e.target.value)} className="w-full text-sm outline-none cursor-pointer mt-1" /></div>
                                <div className="w-1/2 p-3"><label className="block text-xs font-bold text-slate-500 uppercase">Fin</label><input type="date" onChange={(e) => setDateEnd(e.target.value)} className="w-full text-sm outline-none cursor-pointer mt-1" /></div>
                            </div>
                            <div className="p-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Voyageurs</label>
                                <div className="flex justify-between mt-1"><button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 rounded-full border">-</button><span>{guests}</span><button onClick={() => setGuests(guests + 1)} className="w-6 h-6 rounded-full border">+</button></div>
                            </div>
                        </div>

                        <button onClick={handleBooking} disabled={isBooking} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex justify-center items-center">
                            {isBooking ? <Loader2 className="animate-spin" /> : "Réserver"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferDetails;