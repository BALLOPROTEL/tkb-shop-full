import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL API
  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`);
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
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
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

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-blue-500" /> Gestion des Commandes
        </h1>
        <p className="text-slate-400">Suivez et gérez les achats des clients.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* 👇 AJOUTE CETTE DIV POUR LE SCROLL */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Client</th>
                <th className="p-4">Produit</th>
                <th className="p-4">Total</th>
                <th className="p-4">Adresse</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center">Chargement...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center">Aucune commande pour le moment.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">#{order.id.slice(-6)}</td>
                    <td className="p-4 font-bold text-white">{order.userName || "Inconnu"}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{order.productName}</div>
                      <div className="text-xs text-slate-500">Qté: {order.quantity}</div>
                    </td>
                    <td className="p-4 font-bold text-blue-400">{(order.totalPrice || order.price).toLocaleString()} F</td>
                    <td className="p-4 text-xs max-w-[200px] truncate" title={order.address}>{order.address}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {order.status !== 'Livré' && (
                          <button onClick={() => updateStatus(order.id, 'Livré')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white" title="Marquer comme Livré">
                            <Truck size={16} />
                          </button>
                        )}
                        {order.status !== 'Annulé' && (
                          <button onClick={() => updateStatus(order.id, 'Annulé')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white" title="Annuler">
                            <XCircle size={16} />
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
    </AdminLayout>
  );
};

export default AdminOrders;