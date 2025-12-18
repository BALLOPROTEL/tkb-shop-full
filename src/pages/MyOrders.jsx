import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, ShoppingBag, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL API (Local)
  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchOrders = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      try {
        // On appelle la route backend qui filtre par ID utilisateur
        const res = await fetch(`${API_URL}/api/orders/my?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // On trie pour avoir la plus récente en premier
          setOrders(data.reverse());
        }
      } catch (err) {
        console.error("Erreur chargement commandes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fonction pour afficher le bon badge de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Livré': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14} /> Livré</span>;
      case 'Annulé': return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14} /> Annulé</span>;
      default: return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14} /> En préparation</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">

        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
          <Package className="text-blue-600" /> Mes Commandes
        </h1>

        {loading ? (
          <p className="text-slate-500">Chargement de l'historique...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Aucune commande</h3>
            <p className="text-slate-500 mb-6">Vous n'avez pas encore craqué pour nos pépites ?</p>
            <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
              Découvrir la collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-4 border-b border-slate-50 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Commande #{order.id.slice(-6)}</p>
                    <p className="text-sm text-slate-500">Passée le {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 text-xl">
                      {(order.totalPrice || order.price).toLocaleString()} F
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{order.productName}</h3>
                    <p className="text-sm text-slate-500">Quantité: {order.quantity}</p>
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