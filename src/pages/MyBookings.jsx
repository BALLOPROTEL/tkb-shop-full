import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, CheckCircle, XCircle, Loader2, Trash2, Edit2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // On ajoute les notifications

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  // État pour le Modal de Modification
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // 1. CHARGEMENT (CORRIGÉ)
  const fetchMyBookings = async () => {
    const userStored = localStorage.getItem('user');

    // --- CORRECTION ICI ---
    if (!userStored) {
      setLoading(false); // IMPORTANT : On arrête le chargement si pas connecté
      return;
    }

    const user = JSON.parse(userStored);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/bookings/my?userId=${user.id}`);
      if (response.ok) {
        setBookings(await response.json());
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      toast.error("Impossible de charger les voyages");
    } finally {
      setLoading(false); // On arrête le chargement dans tous les cas
    }
  };

  useEffect(() => { fetchMyBookings(); }, []);

  // 2. SUPPRESSION / ANNULATION
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment annuler ce voyage ?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/bookings/${id}`, { method: 'DELETE' });
      toast.success("Voyage annulé");
      fetchMyBookings();
    } catch (err) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  // 3. MODIFICATION (Ouvrir Modal)
  const openEditModal = (booking) => {
    setEditData(booking);
    setIsEditOpen(true);
  };

  // 4. SAUVEGARDE MODIFICATION
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://127.0.0.1:8000/api/bookings/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateStart: editData.dateStart,
          dateEnd: editData.dateEnd,
          guests: editData.guests
        })
      });
      toast.success("Voyage modifié !");
      setIsEditOpen(false);
      fetchMyBookings();
    } catch (err) {
      toast.error("Erreur modification");
    }
  };

  // 5. LOGIQUE HISTORIQUE
  const filteredBookings = bookings.filter(b => {
    const today = new Date();
    const endDate = new Date(b.dateEnd);
    const isPast = endDate < today;

    if (activeTab === 'upcoming') {
      return !isPast && b.status !== 'cancelled';
    } else {
      return isPast || b.status === 'cancelled';
    }
  });

  // --- RENDER ---

  if (loading) return <div className="min-h-screen pt-24 flex justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  // Si pas connecté (L'écran qui ne s'affichait pas avant)
  if (!localStorage.getItem('user')) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 text-center px-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <XCircle size={40} className="text-slate-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Accès Restreint</h2>
        <p className="text-slate-500 mb-8 text-lg max-w-md">Connectez-vous pour retrouver vos réservations, modifier vos dates ou annuler un voyage.</p>
        <Link to="/" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  // Si connecté
  return (
    <div className="container mx-auto px-6 py-24 min-h-screen bg-slate-50">

      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Mes Voyages</h1>
          <p className="text-slate-500">Gérez vos réservations en toute simplicité.</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mt-4 md:mt-0">
          <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>À venir</button>
          <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Historique</button>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row group"
              >
                {/* Image / ID */}
                <div className="md:w-1/3 h-48 md:h-auto bg-slate-100 relative flex items-center justify-center">
                  <MapPin size={40} className="text-slate-300" />
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold font-mono text-slate-600">
                    #{booking.id.slice(-4).toUpperCase()}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{booking.offerTitle}</h3>
                      <div className="flex items-center text-slate-500 mb-2"><MapPin size={14} className="mr-1" /> {booking.location}</div>
                    </div>

                    {/* Statut */}
                    {booking.status === 'confirmed' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Confirmé</span>}
                    {booking.status === 'cancelled' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Annulé</span>}
                    {booking.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> En attente</span>}
                  </div>

                  <div className="flex gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4 mt-2">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Arrivée</p><p>{booking.dateStart}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Départ</p><p>{booking.dateEnd}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Voyageurs</p><p>{booking.guests}</p></div>
                    <div className="ml-auto text-right"><p className="text-xs font-bold text-slate-400 uppercase">Total</p><p className="text-lg font-bold text-slate-900">{booking.price}€</p></div>
                  </div>

                  {/* BOUTONS D'ACTION (Seulement si "À venir") */}
                  {activeTab === 'upcoming' && (
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => openEditModal(booking)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-blue-600 hover:text-white transition-colors text-sm">
                        <Edit2 size={16} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(booking.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-500 hover:text-white transition-colors text-sm">
                        <Trash2 size={16} /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 mb-4">Aucun voyage dans cette section.</p>
              <Link to="/" className="text-blue-600 font-bold hover:underline">Découvrir des offres</Link>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* --- MODAL DE MODIFICATION --- */}
      {isEditOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><X /></button>
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Modifier la réservation</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Arrivée</label>
                  <input type="date" value={editData.dateStart} onChange={(e) => setEditData({ ...editData, dateStart: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Départ</label>
                  <input type="date" value={editData.dateEnd} onChange={(e) => setEditData({ ...editData, dateEnd: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 text-slate-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Voyageurs</label>
                <input type="number" min="1" value={editData.guests} onChange={(e) => setEditData({ ...editData, guests: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 text-slate-900" />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors mt-2">
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;