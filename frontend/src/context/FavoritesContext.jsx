import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FavoritesContext = createContext();
const STORAGE_KEY = 'tkb_favorites_v1';

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error("useFavorites doit être utilisé à l'intérieur d'un FavoritesProvider");
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Erreur de lecture des favoris:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = useCallback((product) => {
        if (!product?.id) return;
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) return prev.filter(p => p.id !== product.id);
            const { id, name, image, price, oldPrice, category, categoryGroup, subcategory, createdAt } = product;
            return [...prev, {
                id,
                name,
                image,
                price,
                oldPrice,
                category,
                categoryGroup,
                subcategory,
                createdAt,
                addedAt: new Date().toISOString()
            }];
        });
    }, []);

    const isFavorite = useCallback((id) => favorites.some(p => p.id === id), [favorites]);

    const value = useMemo(() => ({
        favorites,
        favoritesCount: favorites.length,
        toggleFavorite,
        isFavorite
    }), [favorites, toggleFavorite, isFavorite]);

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
