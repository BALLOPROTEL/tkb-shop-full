import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // États pour le formulaire (Ajout/Modif)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Si null = Ajout, sinon = Modif
  const [formData, setFormData] = useState({
    title: '', location: '', price: '', type: 'accommodation', image: '', description: ''
  });

  const fetchOffers = () => {
    fetch('https://protel-backend.onrender.com/api/offers')
      .then(res => res.json()).then(data => setOffers(data));
  };

  useEffect(() => { fetchOffers(); }, []);

  // Ouvrir le modal (Vide pour ajout, Rempli pour modif)
  const openModal = (offer = null) => {
    if (offer) {
      setEditingId(offer.id);
      setFormData({
        title: offer.title, location: offer.location, price: offer.price,
        type: offer.type, image: offer.image, description: offer.description
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', location: '', price: '', type: 'accommodation', image: '', description: '' });
    }
    setIsModalOpen(true);
  };

  // Sauvegarder (POST ou PUT)
  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `https://protel-backend.onrender.com/api/offers/${editingId}` // Modification
      : 'https://protel-backend.onrender.com/api/offers';             // Création

    const method = editingId ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    setIsModalOpen(false);
    fetchOffers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ?")) {
      await fetch(`https://protel-backend.onrender.com/api/offers/${id}`, { method: 'DELETE' });
      fetchOffers();
    }
  };

  const filtered = offers.filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestion des Offres</h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex gap-2">
          <Plus /> Ajouter
        </button>
      </div>

      <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 mb-6" />

      <div className="space-y-4">
        {filtered.map((offer) => (
          <div key={offer.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={offer.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
              <div>
                <h3 className="font-bold text-white">{offer.title}</h3>
                <div className="text-slate-400 text-sm">{offer.location}</div>
                <div className="text-blue-400 font-bold">{offer.price}€</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal(offer)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(offer.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? "Modifier l'offre" : "Nouvelle Offre"}</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" required />
              <input type="text" placeholder="Lieu" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" required />
              <div className="flex gap-4">
                <input type="number" placeholder="Prix" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-1/2 bg-slate-800 text-white p-3 rounded-lg border border-slate-700" required />
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-1/2 bg-slate-800 text-white p-3 rounded-lg border border-slate-700">
                  <option value="accommodation">Hébergement</option>
                  <option value="activity">Activité</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <input type="text" placeholder="URL Image" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" required />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 h-24"></textarea>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">Sauvegarder</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOffers;