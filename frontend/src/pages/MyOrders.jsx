import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import api from '../api';
import { toast } from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await api.get('/api/orders/my-orders');
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.response?.status === 401) navigate('/');
        else toast.error("Impossible de charger vos commandes.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, [navigate]);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Livré': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Annulé': return 'text-red-400 bg-red-50 border-red-50';
      case 'Payé':
      case 'Payé (Vérifié)': return 'text-pink-600 bg-pink-50 border-pink-100';
      default: return 'text-amber-500 bg-amber-50 border-amber-100';
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-pink-600" size={32} />
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-pink-400 font-bold">Récupération de vos trésors...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-pink-400">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Historique Privé</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-900">Mes Commandes</h1>
          <div className="w-12 h-[1px] bg-pink-200 mx-auto"></div>
        </div>

        {orders.length === 0 ? (
          <div className="max-w-md mx-auto bg-pink-50/30 rounded-[40px] p-12 text-center border border-pink-50">
            <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-pink-200 mb-6" />
            <p className="text-slate-500 font-serif italic text-lg mb-8">Vous n'avez pas encore de pièce dans votre historique.</p>
            <Link to="/" className="inline-block bg-slate-900 text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-pink-600 transition-all">
              Découvrir la collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="group bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-pink-200 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-pink-50/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-24 bg-pink-50 overflow-hidden rounded-lg shrink-0">
                      <img src={order.items?.[0]?.image || "https://via.placeholder.com/150"} alt="Produit" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #ORD-{order.id.slice(-6).toUpperCase()}</p>
                      <h3 className="font-serif text-xl text-slate-900">
                        {order.items?.length > 1 ? `${order.items?.[0]?.name} (+${order.items.length - 1} articles)` : order.items?.[0]?.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-light">Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 gap-2">
                    <p className="text-xl font-light text-slate-900">{order.totalAmount.toLocaleString()} FCFA</p>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="hidden md:block pl-4">
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-pink-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
