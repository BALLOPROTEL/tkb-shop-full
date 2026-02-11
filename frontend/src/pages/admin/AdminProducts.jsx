import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package, Upload, Loader, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { normalize, isNewProduct, isPromo } from '../../utils/product';

const CATEGORY_CONFIG = [
  { group: 'Sacs', subcategories: [] },
  { group: 'Chaussures', subcategories: ['Femme', 'Homme', 'Bébé'] },
  { group: 'Accessoires', subcategories: ['Colliers', 'Bagues', 'Bracelets'] },
  { group: 'Vêtements', subcategories: ['Robes', 'Abayas', 'Voiles & Hijabs'] },
];

const COLOR_PRESETS = ['#000000', '#ffffff', '#d6b27a', '#db2777', '#8b5cf6', '#10b981', '#0f172a', '#f59e0b'];

const AdminProducts = () => {
  const defaultGroup = CATEGORY_CONFIG[0];
  const emptyForm = {
    name: '',
    category: defaultGroup.group,
    categoryGroup: defaultGroup.group,
    subcategory: defaultGroup.subcategories[0] || '',
    price: '',
    oldPrice: '',
    stock: 10,
    image: '',
    images: [],
    description: '',
    colors: [],
    sizes: []
  };
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [sizesInput, setSizesInput] = useState('');
  const [colorInput, setColorInput] = useState('#000000');
  const [colorNameInput, setColorNameInput] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.reverse());
    } catch (error) {
      console.error(error);
      toast.error("Erreur catalogue");
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const inferGroup = (categoryValue = '') => {
    const key = normalize(categoryValue);
    if (['sac', 'sacs'].includes(key)) return 'Sacs';
    if (['chaussure', 'chaussures'].includes(key)) return 'Chaussures';
    if (['accessoire', 'accessoires'].includes(key)) return 'Accessoires';
    if (['vetement', 'vetements'].includes(key)) return 'Vêtements';
    for (const cfg of CATEGORY_CONFIG) {
      if (cfg.subcategories.some(sub => normalize(sub) === key)) return cfg.group;
    }
    return defaultGroup.group;
  };

  const inferSubcategory = (categoryValue = '', groupValue = '') => {
    const cfg = CATEGORY_CONFIG.find(c => c.group === groupValue);
    if (!cfg || cfg.subcategories.length === 0) return '';
    const key = normalize(categoryValue);
    const match = cfg.subcategories.find(sub => normalize(sub) === key);
    return match || cfg.subcategories[0];
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setSizesInput('');
    setColorInput('#000000');
    setColorNameInput('');
    setIsModalOpen(true);
  };

  const openEdit = (product) => {
    const normalizedImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
    const groupValue = product.categoryGroup || inferGroup(product.category);
    const subValue = product.subcategory || inferSubcategory(product.category, groupValue);
    const normalized = {
      ...emptyForm,
      ...product,
      categoryGroup: groupValue,
      subcategory: subValue,
      images: normalizedImages,
      image: product.image || normalizedImages[0] || ''
    };
    setEditingId(product.id);
    setFormData(normalized);
    setSizesInput((normalized.sizes || []).join(', '));
    setColorInput('#000000');
    setColorNameInput('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "ml_default");
        const res = await fetch(`https://api.cloudinary.com/v1_1/dq5uba810/image/upload`, { method: "POST", body: data });
        const fileData = await res.json();
        if (fileData.secure_url) {
          setFormData(prev => ({
            ...prev,
            image: prev.image || fileData.secure_url,
            images: [...(prev.images || []), fileData.secure_url]
          }));
        }
      }
      toast.success("Image(s) téléchargée(s)");
    } catch (error) { console.error(error); toast.error("Erreur upload"); } finally { setUploading(false); }
  };

  const removeImage = (url) => {
    setFormData(prev => {
      const images = (prev.images || []).filter(img => img !== url);
      const image = prev.image === url ? (images[0] || '') : prev.image;
      return { ...prev, images, image };
    });
  };

  const handleGroupChange = (value) => {
    const cfg = CATEGORY_CONFIG.find(c => c.group === value) || defaultGroup;
    setFormData(prev => ({
      ...prev,
      categoryGroup: value,
      subcategory: cfg.subcategories[0] || ''
    }));
    if (value !== 'Chaussures' && value !== 'Vêtements') {
      setSizesInput('');
    }
  };

  const handleFilterGroupChange = (value) => {
    setFilterGroup(value);
    setFilterSubcategory('all');
  };

  const resetFilters = () => {
    setFilterGroup('all');
    setFilterSubcategory('all');
    setFilterStock('all');
    setSortBy('recent');
    setPriceMin('');
    setPriceMax('');
  };

  const parseList = (value) =>
    value.split(',').map(v => v.trim()).filter(Boolean);

  const addColor = (value) => {
    const color = value.trim();
    if (!color) return;
    setFormData(prev => {
      const colors = prev.colors || [];
      if (colors.includes(color)) return prev;
      return { ...prev, colors: [...colors, color] };
    });
  };

  const toggleColor = (color) => {
    setFormData(prev => {
      const colors = prev.colors || [];
      if (colors.includes(color)) {
        return { ...prev, colors: colors.filter(c => c !== color) };
      }
      return { ...prev, colors: [...colors, color] };
    });
  };

  const removeColor = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: (prev.colors || []).filter(c => c !== color)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const colors = (formData.colors || []).map(c => c.trim()).filter(Boolean);
    const sizes = parseList(sizesInput);
    const images = formData.images?.length ? formData.images : (formData.image ? [formData.image] : []);
    const requiresSizes = formData.categoryGroup === 'Chaussures' || formData.categoryGroup === 'Vêtements';
    const sizeLabel = formData.categoryGroup === 'Chaussures' ? 'pointures' : 'tailles';

    if (images.length === 0) {
      toast.error("Ajoutez au moins une image");
      return;
    }
    if (requiresSizes && sizes.length === 0) {
      toast.error(`Ajoutez des ${sizeLabel}`);
      return;
    }

    const payload = {
      ...formData,
      category: formData.subcategory || formData.categoryGroup || formData.category,
      colors,
      sizes,
      images,
      image: formData.image || images[0] || '',
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
      stock: parseInt(formData.stock)
    };

    try {
      if (editingId) await api.put(`/api/products/${editingId}`, payload);
      else await api.post('/api/products', payload);
      toast.success("Catalogue mis à jour");
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) { console.error(error); toast.error("Erreur sauvegarde"); }
  };

  const availableFilterSubcategories = filterGroup === 'all'
    ? Array.from(new Set(CATEGORY_CONFIG.flatMap(cfg => cfg.subcategories || []).filter(Boolean)))
    : (CATEGORY_CONFIG.find(cfg => cfg.group === filterGroup)?.subcategories || []);

  const minPrice = priceMin !== '' ? Number(priceMin) : null;
  const maxPrice = priceMax !== '' ? Number(priceMax) : null;

  const filteredProducts = products.filter(p => {
    const key = searchTerm.toLowerCase();
    const groupValue = p.categoryGroup || inferGroup(p.category);
    const subValue = p.subcategory || inferSubcategory(p.category, groupValue);

    if (key) {
      const match = (
        p.name?.toLowerCase().includes(key) ||
        p.category?.toLowerCase().includes(key) ||
        groupValue?.toLowerCase().includes(key) ||
        subValue?.toLowerCase().includes(key)
      );
      if (!match) return false;
    }

    if (filterGroup !== 'all' && groupValue !== filterGroup) return false;
    if (filterSubcategory !== 'all' && subValue !== filterSubcategory) return false;

    const stock = Number(p.stock || 0);
    if (filterStock === 'in' && stock <= 0) return false;
    if (filterStock === 'out' && stock > 0) return false;
    if (filterStock === 'low' && (stock <= 0 || stock > 5)) return false;

    const price = Number(p.price);
    if ((minPrice !== null || maxPrice !== null) && !Number.isFinite(price)) return false;
    if (minPrice !== null && Number.isFinite(minPrice) && price < minPrice) return false;
    if (maxPrice !== null && Number.isFinite(maxPrice) && price > maxPrice) return false;

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (Number(a.price) || Infinity) - (Number(b.price) || Infinity);
      case 'price-desc':
        return (Number(b.price) || -Infinity) - (Number(a.price) || -Infinity);
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'stock-desc':
        return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      case 'recent':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const currentGroup = formData.categoryGroup || defaultGroup.group;
  const currentConfig = CATEGORY_CONFIG.find(c => c.group === currentGroup) || defaultGroup;
  const showSubcategories = currentConfig.subcategories.length > 0;
  const requiresSizes = currentGroup === 'Chaussures' || currentGroup === 'Vêtements';
  const sizeLabel = currentGroup === 'Chaussures' ? 'Pointures' : 'Tailles';

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Package className="text-blue-500" /> Catalogue</h1>
        <button onClick={openCreate} className="bg-blue-600 px-6 py-2 rounded-xl font-bold">+ Ajouter</button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Recherche par nom ou catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-white"
        />
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterGroup}
            onChange={(e) => handleFilterGroupChange(e.target.value)}
            className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest"
          >
            <option value="all">Tous les groupes</option>
            {CATEGORY_CONFIG.map(cfg => (
              <option key={cfg.group} value={cfg.group}>{cfg.group}</option>
            ))}
          </select>

          <select
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
            disabled={availableFilterSubcategories.length === 0}
            className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <option value="all">Toutes sous-catégories</option>
            {availableFilterSubcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest"
          >
            <option value="all">Tous les stocks</option>
            <option value="in">En stock</option>
            <option value="low">Stock faible</option>
            <option value="out">Rupture</option>
          </select>

          <input
            type="number"
            placeholder="Prix min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-24 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest"
          />
          <input
            type="number"
            placeholder="Prix max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-24 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest"
          />

          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-widest"
            >
              <option value="recent">Récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name-asc">Nom A-Z</option>
              <option value="stock-desc">Stock (max)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-500"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/30">
          Aucun produit trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map(p => {
            const promo = isPromo(p);
            const isNew = isNewProduct(p);
            return (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group">
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" alt="" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isNew && <span className="bg-pink-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Nouveau</span>}
                    {promo && <span className="bg-red-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Promo</span>}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-2 bg-white text-slate-900 rounded-full shadow-lg"><Edit2 size={14} /></button>
                    <button onClick={async () => { if (window.confirm("Supprimer ?")) { await api.delete(`/api/products/${p.id}`); fetchProducts(); } }} className="p-2 bg-red-600 text-white rounded-full shadow-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{p.categoryGroup || p.category}</p>
                  {p.subcategory && <p className="text-[10px] uppercase tracking-widest text-pink-400">{p.subcategory}</p>}
                  <p className="text-blue-400 font-black mt-1">{p.price.toLocaleString()} F</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto pr-2">
            <h2 className="text-xl font-bold">{editingId ? "Édition" : "Nouveau Produit"}</h2>
            <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800" required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.categoryGroup} onChange={e => handleGroupChange(e.target.value)} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                {CATEGORY_CONFIG.map(cfg => <option key={cfg.group} value={cfg.group}>{cfg.group}</option>)}
              </select>
              {showSubcategories ? (
                <select value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {currentConfig.subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              ) : (
                <input type="text" value="Sans sous-catégorie" disabled className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-500" />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="bg-slate-950 p-4 rounded-xl border border-slate-800" />
              <input type="number" placeholder="Prix" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-slate-950 p-4 rounded-xl border border-slate-800" required />
            </div>
            <input type="number" placeholder="Ancien prix (optionnel)" value={formData.oldPrice} onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800" />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[100px]" />
            {requiresSizes && (
              <input
                type="text"
                placeholder={sizeLabel === 'Pointures' ? 'Pointures (ex: 36, 37, 38)' : 'Tailles (ex: XS, S, M, L)'}
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800"
              />
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Couleurs</span>
                <span className="text-[10px] text-slate-500">Clique pour sélectionner</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(color => {
                  const isSelected = (formData.colors || []).includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`w-8 h-8 rounded-full border ${isSelected ? 'ring-2 ring-pink-400 border-pink-400' : 'border-slate-700'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-950" />
                <input type="text" placeholder="Couleur personnalisée (ex: ivoire)" value={colorNameInput} onChange={(e) => setColorNameInput(e.target.value)} className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800" />
                <button type="button" onClick={() => { addColor(colorNameInput || colorInput); setColorNameInput(''); }} className="px-4 py-3 bg-slate-800 rounded-xl text-xs font-bold">Ajouter</button>
              </div>
              {formData.colors?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map(color => (
                    <button key={color} type="button" onClick={() => removeColor(color)} className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 text-[10px]">
                      <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: color }} />
                      <span className="uppercase">{color}</span>
                      <span className="text-xs">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-2 border-dashed border-slate-800 p-8 text-center rounded-xl">
              <input type="file" multiple onChange={handleImageUpload} className="hidden" id="file-up" />
              <label htmlFor="file-up" className="cursor-pointer flex flex-col items-center gap-2">
                {uploading ? <Loader className="animate-spin" /> : <Upload />}
                <span className="text-xs text-slate-500">Ajouter des photos</span>
              </label>
            </div>
            {formData.images?.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img) => (
                  <div key={img} className="relative group">
                    <img src={img} alt="preview" className="h-20 w-full object-cover rounded-lg border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-500">Enregistrer</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 text-xs">Annuler</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
