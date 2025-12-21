import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config'; // <--- IMPORT CONFIG

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Palette de couleurs prédéfinies
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
    oldPrice: '',
    stock: 10,
    image: '',
    description: '',
    colors: []
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
      return {
        ...prev,
        colors: exists
          ? prev.colors.filter(c => c !== hex)
          : [...prev.colors, hex]
      };
    });
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice || '',
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

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `${API_BASE_URL}/api/products/${editingId}` : `${API_BASE_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
      stock: parseInt(formData.stock),
      status: 'Active'
    };

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingId ? "Produit modifié" : "Produit ajouté");
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // ⚠️ PAS DE <AdminLayout> ICI !
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Package className="text-blue-600" /> Gestion des Produits
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex gap-2 shadow-lg transition-all">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-all gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-100" alt="" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="bg-slate-100 px-2 py-1 rounded font-medium border border-slate-200">{p.category}</span>
                  <span className="font-medium">Stock: {p.stock}</span>
                  <div className="flex gap-1 ml-2">
                    {p.colors && p.colors.map(c => (
                      <div key={c} className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              <div className="text-right">
                <div className="text-blue-600 font-bold text-xl">{p.price.toLocaleString()} F</div>
                {p.oldPrice && <div className="text-slate-400 line-through text-sm font-medium">{p.oldPrice.toLocaleString()} F</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-10">Aucun produit trouvé.</p>}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg relative shadow-2xl my-auto animate-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 p-1 rounded-full"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Nom du produit</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option value="Sac">Sac</option><option value="Chaussure">Chaussure</option><option value="Accessoire">Accessoire</option><option value="Vêtement">Vêtement</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Prix Actuel</label>
                  <input type="number" placeholder="ex: 50000" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-pink-500 uppercase font-bold mb-1 block">Ancien Prix (Promo)</label>
                  <input type="number" placeholder="ex: 80000" value={formData.oldPrice} onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Couleurs disponibles</label>
                <div className="flex flex-wrap gap-3">
                  {colorPalette.map((color) => {
                    const isSelected = formData.colors.includes(color.hex);
                    return (
                      <button
                        type="button"
                        key={color.hex}
                        onClick={() => toggleColor(color.hex)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-slate-900 scale-110 shadow-md ring-2 ring-blue-500 ring-offset-2' : 'border-slate-200 hover:scale-105'}`}
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
                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Image URL</label>
                <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 h-24 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl mt-4 shadow-lg transition-all active:scale-95">
                {editingId ? "Enregistrer les modifications" : "Ajouter le produit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;