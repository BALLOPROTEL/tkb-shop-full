import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const colorPalette = [
    { name: 'Noir', hex: '#000000' }, { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Rouge', hex: '#EF4444' }, { name: 'Bleu', hex: '#3B82F6' },
    { name: 'Vert', hex: '#10B981' }, { name: 'Beige', hex: '#D4A373' },
    { name: 'Marron', hex: '#78350F' }, { name: 'Rose', hex: '#EC4899' },
    { name: 'Or', hex: '#FFD700' }, { name: 'Argent', hex: '#C0C0C0' },
  ];

  const [formData, setFormData] = useState({
    name: '', category: 'Sac', price: '', oldPrice: '', stock: 10,
    image: '', description: '', colors: []
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.reverse()); // Plus récents en haut
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleColor = (hex) => {
    setFormData(prev => {
      const exists = prev.colors.includes(hex);
      return { ...prev, colors: exists ? prev.colors.filter(c => c !== hex) : [...prev.colors, hex] };
    });
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, category: product.category, price: product.price,
        oldPrice: product.oldPrice || '', stock: product.stock, image: product.image,
        description: product.description || '', colors: product.colors || []
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: 'Sac', price: '', oldPrice: '', stock: 10, image: '', description: '', colors: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `${API_BASE_URL}/api/products/${editingId}` : `${API_BASE_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';
    const payload = { ...formData, price: parseFloat(formData.price), oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null, stock: parseInt(formData.stock), status: 'Active' };

    try {
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(editingId ? "Produit modifié" : "Produit ajouté");
        setIsModalOpen(false);
        fetchProducts();
      } else { toast.error("Erreur sauvegarde"); }
    } catch (err) { toast.error("Erreur serveur"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce produit ?")) {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-blue-500" /> Gestion des Produits
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex gap-2 shadow-lg shadow-blue-900/20">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-lg relative">
        <Search className="absolute left-7 top-7 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-transparent outline-none text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center hover:bg-slate-700/50 transition-all gap-4 shadow-md">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-600" alt="" />
              <div>
                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="bg-slate-700 px-2 py-1 rounded font-medium border border-slate-600">{p.category}</span>
                  <span className="font-medium text-slate-300">Stock: {p.stock}</span>
                  <div className="flex gap-1 ml-2">
                    {p.colors && p.colors.map(c => (
                      <div key={c} className="w-3 h-3 rounded-full border border-slate-500 shadow-sm" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 border-slate-700 pt-4 md:pt-0">
              <div className="text-right">
                <div className="text-blue-400 font-bold text-xl">{p.price.toLocaleString()} F</div>
                {p.oldPrice && <div className="text-slate-500 line-through text-sm font-medium">{p.oldPrice.toLocaleString()} F</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(p)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-10">Aucun produit trouvé.</p>}
      </div>

      {/* --- MODAL DARK MODE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg relative shadow-2xl my-auto animate-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? "Modifier" : "Ajouter"}</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Nom du produit</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-all" required />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-all">
                    <option value="Sac">Sac</option><option value="Chaussure">Chaussure</option><option value="Accessoire">Accessoire</option><option value="Vêtement">Vêtement</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-all" required />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Prix Actuel</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-all" required />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-pink-400 uppercase font-bold mb-1 block">Ancien Prix</label>
                  <input type="number" value={formData.oldPrice} onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-pink-500 transition-all placeholder:text-slate-600" placeholder="Optionnel" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Couleurs</label>
                <div className="flex flex-wrap gap-3">
                  {colorPalette.map((color) => {
                    const isSelected = formData.colors.includes(color.hex);
                    return (
                      <button type="button" key={color.hex} onClick={() => toggleColor(color.hex)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-white scale-110 shadow-md ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : 'border-slate-600 hover:scale-105'}`}
                        style={{ backgroundColor: color.hex }} title={color.name}>
                        {isSelected && <Check size={14} color={color.hex === '#FFFFFF' ? 'black' : 'white'} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Image URL</label>
                <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-all" required />
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 h-24 outline-none focus:border-blue-500 transition-all resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-4 shadow-lg transition-all active:scale-95">
                {editingId ? "Enregistrer" : "Ajouter le produit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;