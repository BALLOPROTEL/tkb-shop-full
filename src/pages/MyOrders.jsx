import React, { useEffect, useState } from 'react';
import { Package, Loader, ShoppingBag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Fetch all orders (since we don't have a specific endpoint yet)
        const res = await fetch(`${API_BASE_URL}/api/admin/orders`);

        if (!res.ok) {
          throw new Error('Impossible de récupérer les commandes');
        }

        const data = await res.json();

        // --- FILTERING LOGIC ---
        // We filter orders where the stored userId matches the logged-in user's id
        // We use String() to ensure we compare strings to strings
        const myOrders = data.filter(order => String(order.userId) === String(user.id));

        // Sort by date (newest first) just in case the API didn't
        myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOrders(myOrders);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Non connecté</h2>
          <p className="text-slate-500 mb-6">Veuillez vous connecter pour voir vos commandes.</p>
          <Link to="/" className="inline-block w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-pink-600" size={32} />
          <p className="text-sm font-medium text-slate-500">Chargement de vos achats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8 flex items-center gap-3">
          <Package className="text-pink-600" /> Mes Commandes
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aucune commande pour l'instant</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Votre garde-robe attend ses nouvelles pièces favorites. Découvrez nos collections exclusives.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
              <ShoppingBag size={18} />
              Découvrir la collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-pink-600 transition-colors">
                      {order.productName || "Panier standard"}
                    </h3>
                  </div>

                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${order.status === 'Livré' ? 'bg-green-100 text-green-700' :
                    order.status === 'En préparation' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      'bg-orange-50 text-orange-700 border border-orange-100'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${order.status === 'Livré' ? 'bg-green-500' :
                      order.status === 'En préparation' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}></span>
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                    <span className="font-bold text-slate-900">{order.totalPrice?.toLocaleString()} FCFA</span>
                  </div>
                  <button className="text-sm font-bold text-slate-500 hover:text-slate-900 underline">
                    Voir détails
                  </button>
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