import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config'; // <--- IMPORT CONFIG (Plus pro)

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        // On trie pour avoir les plus récentes en haut
        setOrders(data.reverse());
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le statut (ex: valider une commande)
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Commande passée à : ${newStatus}`);
        fetchOrders(); // Rafraîchir la liste
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Livré': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Livré</span>;
      case 'Annulé': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Annulé</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> En cours</span>;
    }
  };

  // ⚠️ NOTE IMPORTANTE : PAS DE <AdminLayout> ICI !
  // C'est App.jsx qui s'en occupe. Ici on retourne juste le contenu.
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Package className="text-blue-600" /> Gestion des Commandes
        </h1>
        <p className="text-slate-500">Suivez et gérez les achats des clients.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">Client</th>
                <th className="p-4 border-b">Produit</th>
                <th className="p-4 border-b">Total</th>
                <th className="p-4 border-b">Adresse</th>
                <th className="p-4 border-b">Statut</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500">Chargement...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500">Aucune commande pour le moment.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-400">#{order.id.slice(-6)}</td>
                    <td className="p-4 font-bold text-slate-900">{order.userName || "Inconnu"}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{order.productName}</div>
                      <div className="text-xs text-slate-500">Qté: {order.quantity}</div>
                    </td>
                    <td className="p-4 font-bold text-blue-600">{(order.totalPrice || order.price).toLocaleString()} F</td>
                    <td className="p-4 text-slate-500 max-w-[200px] truncate" title={order.address}>{order.address}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {order.status !== 'Livré' && (
                          <button onClick={() => updateStatus(order.id, 'Livré')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Marquer comme Livré">
                            <Truck size={18} />
                          </button>
                        )}
                        {order.status !== 'Annulé' && (
                          <button onClick={() => updateStatus(order.id, 'Annulé')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Annuler">
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;