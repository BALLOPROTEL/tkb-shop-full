import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('protel_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('protel_cart', JSON.stringify(cart));
    }, [cart]);

    // Ajouter
    const addToCart = (product, quantity, size = null) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id && item.size === size);
            if (existingItem) {
                return prevCart.map(item =>
                    (item.id === product.id && item.size === size)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity, size }];
            }
        });
        toast.success("Ajouté au panier !");
    };

    // --- NOUVELLE FONCTION : Modifier quantité (+/-) ---
    const updateQuantity = (id, size, amount) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === id && item.size === size) {
                const newQty = item.quantity + amount;
                return { ...item, quantity: newQty > 0 ? newQty : 1 }; // Minimum 1
            }
            return item;
        }));
    };

    // Retirer
    const removeFromCart = (id, size) => {
        setCart(prevCart => prevCart.filter(item => !(item.id === id && item.size === size)));
        toast.error("Article retiré");
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};