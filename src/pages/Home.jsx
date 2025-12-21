import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
// 👇 IMPORT DU HERO (Le mix des deux mondes)
import Hero from '../components/home/Hero';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tous');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; 

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.reverse());
        }
      } catch (error) {
        console.error("Erreur chargement", error);
        toast.error("Impossible de charger les produits");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fix du scroll quand on change de page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filtrage
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'Tous' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const handleAddToCart = (e, product) => {
      e.preventDefault();
      addToCart(product);
      toast.success("Ajouté au panier !");
  };

  const categories = ['Tous', 'Sac', 'Chaussure', 'Accessoire', 'Vêtement'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* 👇 LE COMPOSANT HERO (Propre & Design) */}
      <Hero 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={() => setCurrentPage(1)} 
      />

      <div className="container mx-auto px-6 mt-12">
        
        {/* FILTRES CATÉGORIES */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => { setCategory(cat); setCurrentPage(1); }}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md ${
                        category === cat 
                        ? 'bg-pink-600 text-white scale-105' 
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* LISTE PRODUITS */}
        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-3xl h-80 animate-pulse"></div>
                ))}
            </div>
        ) : currentProducts.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-2xl text-slate-400 font-serif">Aucun article trouvé.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                    <Link to={`/products/${product.id}`} key={product.id} className="group bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col">
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-slate-100">
                            <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {product.oldPrice && (
                                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                                    PROMO
                                </span>
                            )}
                            <button 
                                onClick={(e) => handleAddToCart(e, product)}
                                className="absolute bottom-3 right-3 bg-white p-3 rounded-full shadow-lg text-slate-900 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 hover:bg-slate-900 hover:text-white"
                            >
                                <ShoppingBag size={20} />
                            </button>
                        </div>
                        
                        <div className="mt-auto">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{product.category}</p>
                            <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight group-hover:text-pink-600 transition-colors line-clamp-1">{product.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-pink-600 font-extrabold text-lg">{product.price.toLocaleString()} F CFA</span>
                                {product.oldPrice && (
                                    <span className="text-slate-300 line-through text-sm">{product.oldPrice.toLocaleString()} F CFA</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16">
                <button 
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                        currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                    }`}
                >
                    <ChevronLeft size={24}/>
                </button>

                <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                                currentPage === i + 1
                                ? 'bg-slate-900 text-white shadow-lg scale-110'
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                        currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                    }`}
                >
                    <ChevronRight size={24}/>
                </button>
            </div>
        )}

        <div className="mt-8 text-center text-slate-400 text-sm pb-10">
            Affichage de {currentProducts.length} articles sur {filteredProducts.length}
        </div>

      </div>
    </div>
  );
};

export default Home;