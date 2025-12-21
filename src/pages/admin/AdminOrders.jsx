import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, Search, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtrage dynamique quand on tape
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = orders.filter(order =>
      order.id.toLowerCase().includes(lowerTerm) ||
      (order.userName || "").toLowerCase().includes(lowerTerm) ||
      (order.status || "").toLowerCase().includes(lowerTerm)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        // Tri : Les plus récents en premier
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData);
        setFilteredOrders(sortedData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Statut mis à jour : ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error("Erreur maj statut");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Livré': return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/30"><CheckCircle size={12} /> Livré</span>;
      case 'Annulé': return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-red-500/30"><XCircle size={12} /> Annulé</span>;
      default: return <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-500/30"><Clock size={12} /> En cours</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-blue-500" /> Gestion des Commandes
        </h1>
        <p className="text-slate-400">Suivez et gérez les achats des clients.</p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-lg flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Chercher par ID, Client ou Statut..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
        />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-bold border-b border-slate-700">
              <tr>
                <th className="p-4 border-b border-slate-700">ID</th>
                <th className="p-4 border-b border-slate-700">Client</th>
                <th className="p-4 border-b border-slate-700">Produit</th>
                <th className="p-4 border-b border-slate-700">Total</th>
                <th className="p-4 border-b border-slate-700">Adresse</th>
                <th className="p-4 border-b border-slate-700">Statut</th>
                <th className="p-4 border-b border-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500"><Loader className="animate-spin mx-auto mb-2" />Chargement...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500">Aucune commande trouvée.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 text-xs">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="p-4 font-bold text-white">{order.userName || "Inconnu"}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{order.productName}</div>
                      <div className="text-xs text-slate-500">Qté: {order.quantity}</div>
                    </td>
                    <td className="p-4 font-bold text-blue-400">{(order.totalPrice || order.price).toLocaleString()} F</td>
                    <td className="p-4 text-slate-400 text-xs max-w-[200px] truncate" title={order.address}>{order.address}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {order.status !== 'Livré' && (
                          <button onClick={() => updateStatus(order.id, 'Livré')} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors" title="Valider Livraison">
                            <Truck size={18} />
                          </button>
                        )}
                        {order.status !== 'Annulé' && (
                          <button onClick={() => updateStatus(order.id, 'Annulé')} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="Annuler">
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