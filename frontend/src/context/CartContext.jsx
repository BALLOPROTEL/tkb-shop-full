import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('tkb_cart_v1');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Erreur de lecture du panier:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('tkb_cart_v1', JSON.stringify(cart));
    }, [cart]);

    const addToCart = useCallback((product, quantity, size = null, color = null) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item =>
                item.id === product.id &&
                item.selectedSize === size &&
                item.selectedColor === color
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex] = {
                    ...newCart[existingItemIndex],
                    quantity: newCart[existingItemIndex].quantity + quantity
                };
                return newCart;
            } else {
                return [...prevCart, {
                    ...product,
                    quantity,
                    selectedSize: size,
                    selectedColor: color
                }];
            }
        });
        toast.success("Pièce ajoutée à votre sélection");
    }, []);

    const updateQuantity = useCallback((id, size, amount, color = null) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
                const newQty = item.quantity + amount;
                return { ...item, quantity: newQty > 0 ? newQty : 1 };
            }
            return item;
        }));
    }, []);

    const removeFromCart = useCallback((id, size, color = null) => {
        setCart(prevCart => prevCart.filter(item =>
            !(item.id === id && item.selectedSize === size && item.selectedColor === color)
        ));
        toast.dismiss();
        toast.error("Article retiré de la sélection");
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        localStorage.removeItem('tkb_cart_v1');
    }, []);

    const cartTotal = useMemo(() =>
        cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        [cart]);

    const cartCount = useMemo(() =>
        cart.reduce((count, item) => count + item.quantity, 0),
        [cart]);

    const value = useMemo(() => ({
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount
    }), [cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
