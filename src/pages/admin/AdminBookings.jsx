import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, XCircle, Calendar, Trash2, Ban, Hourglass } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllBookings(); }, []);

  // --- NOUVELLE FONCTION : Changer le statut ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // On rafraîchit la liste pour voir le changement immédiat
      fetchAllBookings();
    } catch (error) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ?")) return;
    await fetch(`http://127.0.0.1:8000/api/admin/bookings/${id}`, { method: 'DELETE' });
    fetchAllBookings();
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Gestion des Réservations</h1>
        <p className="text-slate-400">Gérez les statuts des commandes.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize border ${filter === status ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
          >
            {status === 'all' ? 'Toutes' : status}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase border-b border-slate-700">
              <th className="p-6">Réf.</th>
              <th className="p-6">Client</th>
              <th className="p-6">Offre</th>
              <th className="p-6">Statut Actuel</th>
              <th className="p-6 text-right">Modifier le statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredBookings.map((bk) => (
              <tr key={bk.id} className="hover:bg-slate-700/30">
                <td className="p-6 text-slate-500 font-mono text-xs">#{bk.id.slice(-6)}</td>
                <td className="p-6 font-bold text-white">{bk.userName || "Client"}</td>
                <td className="p-6 text-slate-300">{bk.offerTitle}</td>

                {/* Affichage du Statut */}
                <td className="p-6">
                  {bk.status === 'confirmed' && <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs font-bold flex w-fit gap-1"><CheckCircle size={12} /> Confirmée</span>}
                  {bk.status === 'pending' && <span className="text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-xs font-bold flex w-fit gap-1"><Clock size={12} /> En attente</span>}
                  {bk.status === 'cancelled' && <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-bold flex w-fit gap-1"><XCircle size={12} /> Annulée</span>}
                </td>

                {/* --- BOUTONS D'ACTION --- */}
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Bouton Confirmer */}
                    <button
                      onClick={() => handleStatusChange(bk.id, 'confirmed')}
                      className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors"
                      title="Valider"
                    >
                      <CheckCircle size={16} />
                    </button>

                    {/* Bouton Mettre en Attente */}
                    <button
                      onClick={() => handleStatusChange(bk.id, 'pending')}
                      className="p-2 bg-yellow-500/10 text-yellow-500 rounded hover:bg-yellow-500 hover:text-white transition-colors"
                      title="Mettre en attente"
                    >
                      <Hourglass size={16} />
                    </button>

                    {/* Bouton Annuler */}
                    <button
                      onClick={() => handleStatusChange(bk.id, 'cancelled')}
                      className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                      title="Annuler la réservation"
                    >
                      <Ban size={16} />
                    </button>

                    {/* Bouton Supprimer (Corbeille) */}
                    <button onClick={() => handleDelete(bk.id)} className="p-2 bg-slate-700 text-slate-400 rounded hover:bg-slate-600 hover:text-white ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;