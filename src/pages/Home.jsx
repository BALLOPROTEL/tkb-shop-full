import React from 'react';
import Hero from '../components/home/Hero'; // <--- Import de la bannière
import ProductGrid from '../components/home/ProductGrid';

const Home = () => {
    return (
        <div className="min-h-screen">
            <Hero /> {/* <--- La bannière s'affiche ici, en haut */}
            <ProductGrid />
        </div>
    );
};

export default Home;