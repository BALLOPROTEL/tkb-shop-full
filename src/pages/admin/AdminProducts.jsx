import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package, Tag, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Palette de couleurs prédéfinies pour l'admin
  const colorPalette = [
    { name: 'Noir', hex: '#000000' },
    { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Rouge', hex: '#EF4444' },
    { name: 'Bleu', hex: '#3B82F6' },
    { name: 'Vert', hex: '#10B981' },
    { name: 'Beige', hex: '#D4A373' },
    { name: 'Marron', hex: '#78350F' },
    { name: 'Rose', hex: '#EC4899' },
    { name: 'Or', hex: '#FFD700' },
    { name: 'Argent', hex: '#C0C0C0' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    category: 'Sac',
    price: '',
    oldPrice: '', // Nouveau champ
    stock: 10,
    image: '',
    description: '',
    colors: []    // Nouveau champ (tableau de codes HEX)
  });

  const API_URL = "http://127.0.0.1:8000";

  // Charger les produits
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Gestion de la sélection de couleur
  const toggleColor = (hex) => {
    setFormData(prev => {
      const exists = prev.colors.includes(hex);
      return {
        ...prev,
        colors: exists
          ? prev.colors.filter(c => c !== hex) // Si déjà là, on enlève
          : [...prev.colors, hex]              // Sinon on ajoute
      };
    });
  };

  // Ouvrir Modal
  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice || '', // Gérer si vide
        stock: product.stock,
        image: product.image,
        description: product.description || '',
        colors: product.colors || []
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '', category: 'Sac', price: '', oldPrice: '', stock: 10,
        image: '', description: '', colors: []
      });
    }
    setIsModalOpen(true);
  };

  // Sauvegarder
  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `${API_URL}/api/products/${editingId}` : `${API_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';

    // Préparation des données (conversion nombres)
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
      stock: parseInt(formData.stock),
      status: 'Active'
    };

    try {
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      toast.success(editingId ? "Modifié avec succès" : "Ajouté avec succès");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  // Supprimer
  const handleDelete = async (id) => {
    if (confirm("Supprimer ?")) {
      await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-blue-500" /> Gestion des Produits
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex gap-2">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 mb-6" />

      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-750">
            <div className="flex items-center gap-4">
              <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-slate-700" alt="" />
              <div>
                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="bg-slate-700 px-2 py-0.5 rounded">{p.category}</span>
                  <span>Stock: {p.stock}</span>
                  {/* Affichage des couleurs dans la liste */}
                  <div className="flex gap-1 ml-2">
                    {p.colors && p.colors.map(c => (
                      <div key={c} className="w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-blue-400 font-bold text-xl">{p.price.toLocaleString()} F</div>
                {p.oldPrice && <div className="text-slate-500 line-through text-sm">{p.oldPrice.toLocaleString()} F</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(p)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg relative shadow-2xl my-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? "Modifier" : "Ajouter"}</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Nom du produit</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500" required />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500">
                    <option value="Sac">Sac</option><option value="Chaussure">Chaussure</option><option value="Accessoire">Accessoire</option><option value="Vêtement">Vêtement</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Prix Actuel</label>
                  <input type="number" placeholder="ex: 50000" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold text-pink-400">Ancien Prix (Promo)</label>
                  <input type="number" placeholder="ex: 80000" value={formData.oldPrice} onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-pink-500 placeholder:text-slate-600" />
                </div>
              </div>

              {/* SÉLECTEUR DE COULEURS */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Couleurs disponibles</label>
                <div className="flex flex-wrap gap-3">
                  {colorPalette.map((color) => {
                    const isSelected = formData.colors.includes(color.hex);
                    return (
                      <button
                        type="button"
                        key={color.hex}
                        onClick={() => toggleColor(color.hex)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSelected && <Check size={14} color={color.hex === '#FFFFFF' ? 'black' : 'white'} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Image URL</label>
                <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500" required />
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 h-24 outline-none focus:border-blue-500 resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg">Sauvegarder</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;