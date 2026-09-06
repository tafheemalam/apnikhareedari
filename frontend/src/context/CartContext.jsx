import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as cartService from '../services/cartService';
import * as cartBasketService from '../services/cartBasketService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Re-fetch when auth state flips (guest cart merges into the user cart on login).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addItem = useCallback(async (payload) => {
    const data = await cartService.addToCart(payload);
    setCart(data);
    return data;
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const data = await cartService.updateCartItem(itemId, quantity);
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const data = await cartService.removeCartItem(itemId);
    setCart(data);
    return data;
  }, []);

  const clear = useCallback(async () => {
    const data = await cartService.clearCart();
    setCart(data);
    return data;
  }, []);

  const startBasket = useCallback(async (basketId) => {
    const data = await cartBasketService.startBasket(basketId);
    setCart(data);
    return data;
  }, []);

  const addBasketItem = useCallback(async (cartBasketId, payload) => {
    const data = await cartBasketService.addBasketItem(cartBasketId, payload);
    setCart(data);
    return data;
  }, []);

  const removeBasketItem = useCallback(async (cartBasketId, itemId) => {
    const data = await cartBasketService.removeBasketItem(cartBasketId, itemId);
    setCart(data);
    return data;
  }, []);

  const removeBasketInstance = useCallback(async (cartBasketId) => {
    const data = await cartBasketService.removeBasketInstance(cartBasketId);
    setCart(data);
    return data;
  }, []);

  const value = {
    cart,
    items: cart?.items ?? [],
    itemsCount: (cart?.items_count ?? 0) + (cart?.basket_instances_count ?? 0),
    basketInstances: cart?.basket_instances ?? [],
    subtotal: cart?.subtotal ?? 0,
    loading,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clear,
    startBasket,
    addBasketItem,
    removeBasketItem,
    removeBasketInstance,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
