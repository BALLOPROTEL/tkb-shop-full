import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package, Check, Upload, Loader, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- CONFIGURATION CLOUDINARY ---
  const CLOUD_NAME = "dq5uba810";
  const UPLOAD_PRESET = "ml_default";

  // Palette de couleurs
  const colorPalette = [
    { name: 'Noir', hex: '#000000' }, { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Rouge', hex: '#EF4444' }, { name: 'Bleu', hex: '#3B82F6' },
    { name: 'Vert', hex: '#10B981' }, { name: 'Beige', hex: '#D4A373' },
    { name: 'Marron', hex: '#78350F' }, { name: 'Rose', hex: '#EC4899' },
    { name: 'Or', hex: '#FFD700' }, { name: 'Argent', hex: '#C0C0C0' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    category: 'Sac',
    price: '',
    oldPrice: '',
    stock: 10,
    image: '',       // Image principale (string) - POINTEUR vers une image dans 'images'
    images: [],      // Galerie COMPLÈTE (array de strings) - CONTIENT TOUTES les images y compris la principale
    description: '',
    colors: []
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.reverse());
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, []);

  // --- FONCTION UPLOAD MULTIPLE (CORRIGÉE) ---
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      // On envoie chaque image une par une à Cloudinary
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: data
        });
        const fileData = await res.json();
        if (fileData.secure_url) {
          uploadedUrls.push(fileData.secure_url);
        }
      }

      // ✅ CORRECTION: On ajoute les nouvelles images à 'images' sans doublons
      // Et si pas d'image principale, la 1ère uploadée devient la principale
      setFormData(prev => {
        const allImages = [...prev.images, ...uploadedUrls];
        // Supprimer les doublons
        const uniqueImages = [...new Set(allImages)];

        return {
          ...prev,
          // Si pas d'image principale, on prend la première image disponible
          image: prev.image || uniqueImages[0] || '',
          // Toutes les images vont dans 'images'
          images: uniqueImages
        };
      });

      toast.success(`${uploadedUrls.length} image(s) ajoutée(s) !`);

    } catch (error) {
      console.error("Erreur Cloudinary", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  // ✅ CORRECTION: Définir une image comme image principale (Couverture)
  const setMainImage = (imgUrl) => {
    setFormData(prev => ({ ...prev, image: imgUrl }));
    toast.success("Image de couverture mise à jour");
  };

  // ✅ CORRECTION: Supprimer une image de la galerie
  const removeImage = (imgUrl) => {
    setFormData(prev => {
      // Filtrer l'image supprimée
      const newImages = prev.images.filter(img => img !== imgUrl);

      // Si on supprime l'image principale, on la remplace par la première restante
      let newMainImage = prev.image;
      if (prev.image === imgUrl) {
        newMainImage = newImages.length > 0 ? newImages[0] : '';
      }

      return {
        ...prev,
        images: newImages,
        image: newMainImage
      };
    });
    toast.success("Image supprimée");
  };

  const toggleColor = (hex) => {
    setFormData(prev => {
      const exists = prev.colors.includes(hex);
      return { ...prev, colors: exists ? prev.colors.filter(c => c !== hex) : [...prev.colors, hex] };
    });
  };

  // ✅ CORRECTION: Ouvrir le modal avec les bonnes données
  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);

      // S'assurer que l'image principale est dans la liste des images
      let productImages = product.images || [];
      if (product.image && !productImages.includes(product.image)) {
        productImages = [product.image, ...productImages];
      }

      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice || '',
        stock: product.stock,
        image: product.image || (productImages.length > 0 ? productImages[0] : ''),
        images: productImages,
        description: product.description || '',
        colors: product.colors || []
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: 'Sac',
        price: '',
        oldPrice: '',
        stock: 10,
        image: '',
        images: [],
        description: '',
        colors: []
      });
    }
    setIsModalOpen(true);
  };

  // ✅ CORRECTION: Sauvegarde avec images correctes
  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `${API_BASE_URL}/api/products/${editingId}` : `${API_BASE_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';

    // 1. On prépare la liste d'images (Unique et sans vides)
    const cleanImages = [...new Set(formData.images)].filter(Boolean);

    // 2. On détermine l'image principale
    const mainImage = formData.image || cleanImages[0] || "";

    // 3. On prépare le paquet avec des types SÛRS (Évite l'erreur 422)
    const payload = {
      name: formData.name,
      category: formData.category,

      // Force conversion en nombre (évite "20" en string)
      price: parseFloat(formData.price) || 0,

      // Si ancien prix est vide, on envoie null (très important pour Pydantic)
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,

      stock: parseInt(formData.stock) || 0,

      image: mainImage,
      images: cleanImages, // La liste complète

      description: formData.description || "",
      colors: formData.colors || [],
      status: 'Active'
    };

    console.log("ENVOI SÉCURISÉ :", payload);

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingId ? "Produit modifié !" : "Produit ajouté !");
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const errorData = await res.json();
        console.error("ERREUR BACKEND :", errorData);
        // Affiche le détail de l'erreur pour comprendre
        const msg = errorData.detail?.[0]?.msg || "Erreur inconnue";
        toast.error(`Erreur : ${msg}`);
      }
    } catch (err) {
      console.error("ERREUR RÉSEAU :", err);
      toast.error("Erreur serveur");
    }
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
              <div className="relative">
                {/* Par ça (Protection anti-crash) : */}
                <img
                  src={p.image || "https://via.placeholder.com/150"}
                  className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-600"
                  alt={p.name}
                />
                {/* Petit indicateur s'il y a plusieurs photos */}
                {p.images && p.images.length > 1 && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {p.images.length}
                  </div>
                )}
              </div>
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
                <div className="text-blue-400 font-bold text-xl">{p.price.toLocaleString()} F CFA</div>
                {p.oldPrice && <div className="text-slate-500 line-through text-sm font-medium">{p.oldPrice.toLocaleString()} F CFA</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(p)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg relative shadow-2xl my-auto">
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

              {/* --- GESTION DES PHOTOS (CORRIGÉE) --- */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-xs text-slate-400 uppercase font-bold mb-3 block flex items-center gap-2">
                  <ImageIcon size={14} /> Galerie Photos ({formData.images.length})
                </label>

                {/* Zone d'upload */}
                <div className="mb-4">
                  <label className={`cursor-pointer group relative w-full h-16 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploading ? <Loader className="animate-spin text-blue-500" size={24} /> : <Upload size={24} className="text-slate-400 group-hover:text-blue-500" />}
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white">
                      {uploading ? "Envoi en cours..." : "Ajouter des photos (Sélection multiple)"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* ✅ CORRECTION: Grille des images - On affiche UNIQUEMENT formData.images */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.map((img, index) => {
                      const isMain = img === formData.image;
                      return (
                        <div key={`${img}-${index}`} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${isMain ? 'border-green-500' : 'border-slate-700'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />

                          {/* Badge Principale */}
                          {isMain && <div className="absolute bottom-0 inset-x-0 bg-green-500 text-white text-[9px] font-bold text-center py-0.5">COVER</div>}

                          {/* Actions au survol */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {!isMain && (
                              <button type="button" onClick={() => setMainImage(img)} className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white font-bold hover:bg-blue-500">
                                Cover
                              </button>
                            )}
                            <button type="button" onClick={() => removeImage(img)} className="bg-red-500 p-1.5 rounded-full text-white hover:bg-red-600">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 h-24 outline-none focus:border-blue-500 transition-all resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-4 shadow-lg transition-all active:scale-95" disabled={uploading}>
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