import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ProductGrid = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Tout');

    // --- PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 8; // <--- C'est ici qu'on règle le nombre (8)

    const { addToCart } = useCart();
    const location = useLocation();
    const API_URL = "https://tkb-shop.onrender.com";

    // Charger les produits
    useEffect(() => {
        fetch(`${API_URL}/api/products`)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Activer le filtre via l'URL
    useEffect(() => {
        if (location.hash === '#sacs') setActiveCategory('Sac');
        else if (location.hash === '#chaussures') setActiveCategory('Chaussure');
        else if (location.hash === '#accessoires') setActiveCategory('Accessoire');
        else if (location.hash === '#vetements') setActiveCategory('Vêtement');
        else if (location.hash === '#promos') setActiveCategory('Promotions');
    }, [location]);

    // IMPORTANT : Remettre à la page 1 quand on change de catégorie
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    // Liste des filtres
    const categories = [
        { id: 'Tout', label: 'Tout' },
        { id: 'Sac', label: 'Sacs' },
        { id: 'Chaussure', label: 'Chaussures' },
        { id: 'Vêtement', label: 'Vêtements' },
        { id: 'Accessoire', label: 'Accessoires' },
        { id: 'Promotions', label: '🔥 Promos' }
    ];

    // 1. Filtrage
    const filteredProducts = products.filter(product => {
        if (activeCategory === 'Tout') return true;
        if (activeCategory === 'Promotions') {
            return product.oldPrice && product.oldPrice > product.price;
        }
        return product.category === activeCategory;
    });

    // 2. Pagination (Calcul mathématique)
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    // Fonction pour changer de page et scroller vers le haut de la grille
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Chargement de la collection...</div>;

    return (
        <section id="collection" className="py-16 bg-white min-h-screen">
            <div className="container mx-auto px-6">

                {/* TITRE */}
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 text-center uppercase tracking-wider font-serif">
                    Nos Collections
                </h2>

                {/* MENU DE FILTRES */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${activeCategory === cat.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* GRILLE PRODUITS (On affiche currentProducts, pas filteredProducts) */}
                {currentProducts.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl">
                        <Filter size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Aucun article trouvé dans cette catégorie.</p>
                        <button onClick={() => setActiveCategory('Tout')} className="text-blue-600 font-bold mt-2 hover:underline">Voir tout le catalogue</button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {currentProducts.map((product) => (
                                <ProductCard key={product.id} product={product} addToCart={addToCart} />
                            ))}
                        </div>

                        {/* --- BARRE DE PAGINATION --- */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-16">
                                {/* Bouton Précédent */}
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                {/* Numéros de page */}
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => paginate(index + 1)}
                                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${currentPage === index + 1
                                                ? 'bg-slate-900 text-white shadow-md scale-110'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}

                                {/* Bouton Suivant */}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Info page */}
                        <p className="text-center text-xs text-slate-400 mt-4">
                            Affichage de {currentProducts.length} articles sur {filteredProducts.length}
                        </p>
                    </>
                )}

            </div>
        </section>
    );
};

// --- COMPOSANT CARTE (Inchangé) ---
const ProductCard = ({ product, addToCart }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const oldPrice = product.oldPrice || (product.price * 1.2);
    const discount = product.oldPrice && product.oldPrice > product.price
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    const isPromo = discount > 0;
    const isOutOfStock = product.stock === 0;

    // On simule des couleurs pour le style si la liste est vide, sinon on prend les vraies
    const displayColors = product.colors && product.colors.length > 0
        ? product.colors
        : ['#1a1a1a', '#e5e5e5', '#d4a373'];

    return (
        <div
            className="group relative flex flex-col gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                <Link to={`/products/${product.id}`}>
                    <img
                        src={product.image}
                        alt={product.name}
                        className={`h-full w-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'} ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                    />
                </Link>

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isOutOfStock && <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest shadow-md">Épuisé</span>}
                    {!isOutOfStock && isPromo && <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-1 shadow-md">-{discount}%</span>}
                </div>

                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-all shadow-sm group-hover:scale-110"
                >
                    <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-900"} />
                </button>

                {!isOutOfStock && (
                    <div className={`absolute bottom-4 left-0 right-0 px-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <button
                            onClick={() => addToCart(product, 1)}
                            className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-xl hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={14} /> Ajouter
                        </button>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-medium text-slate-900 uppercase text-sm tracking-wide truncate">
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>

                <div className="flex items-center gap-3 mt-1 mb-2">
                    <span className="font-bold text-slate-900">{product.price.toLocaleString()} F</span>
                    {isPromo && <span className="text-xs text-gray-400 line-through">{product.oldPrice.toLocaleString()} F</span>}
                </div>

                <div className="flex gap-2">
                    {displayColors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c }}></div>
                    ))}
                    {displayColors.length > 4 && <span className="text-[10px] text-gray-400">+{displayColors.length - 4}</span>}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;