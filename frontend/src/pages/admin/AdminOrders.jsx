import React, { useState, useEffect } from 'react';
import { Package, Truck, XCircle, Search, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/admin/orders');
      setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status: newStatus });
      toast.success(`Commande ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error("Erreur de mise à jour");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Livré': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Annulé': 'bg-red-500/20 text-red-400 border-red-500/30',
      'default': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    const style = styles[status] || styles['default'];
    return <span className={`${style} px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit`}>{status}</span>;
  };

  const filtered = orders.filter(o => o.id.includes(searchTerm) || (o.userName && o.userName.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-8">
        <Package className="text-blue-500" /> Commandes Clients
      </h1>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input type="text" placeholder="Recherche..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none text-white" />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto shadow-2xl">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-slate-950 text-slate-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-6">ID / Date</th>
              <th className="p-6">Client</th>
              <th className="p-6">Détails</th>
              <th className="p-6">Statut</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center"><Loader className="animate-spin mx-auto text-blue-500" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-16 text-center text-slate-500 text-sm">Aucune commande trouvée.</td></tr>
            ) : filtered.map((order) => (
              <tr key={order.id} className="hover:bg-slate-800/50">
                <td className="p-6"><div className="font-mono text-xs text-blue-400">#{order.id.slice(-6).toUpperCase()}</div><div className="text-[10px] text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div></td>
                <td className="p-6"><div className="font-bold">{order.userName || "Client"}</div><div className="text-[10px] text-slate-500">{order.phone}</div></td>
                <td className="p-6 text-sm">{(order.totalAmount || order.totalPrice).toLocaleString()} F</td>
                <td className="p-6">{getStatusBadge(order.status)}</td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => updateStatus(order.id, 'Livré')} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white"><Truck size={16} /></button>
                    <button onClick={() => updateStatus(order.id, 'Annulé')} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white"><XCircle size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;

