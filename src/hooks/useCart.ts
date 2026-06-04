import { useCallback, useMemo, useState } from 'react';
import { CartItem } from '../types';

type NewCartItem = Omit<CartItem, 'quantity'>;

function sameCartSelection(item: CartItem, newItem: NewCartItem): boolean {
  return (
    item.product.id === newItem.product.id &&
    item.selectedSize === newItem.selectedSize &&
    item.selectedColorHex === newItem.selectedColorHex
  );
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = useCallback((newItem: NewCartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => sameCartSelection(item, newItem));

      if (existingIndex === -1) {
        return [...prev, { ...newItem, quantity: 1 }];
      }

      return prev.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
    setCartOpen(true);
  }, []);

  const updateQuantity = useCallback((index: number, delta: number) => {
    setCartItems((prev) =>
      prev.flatMap((item, itemIndex) => {
        if (itemIndex !== index) return [item];

        const nextQuantity = item.quantity + delta;
        return nextQuantity < 1 ? [] : [{ ...item, quantity: nextQuantity }];
      })
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setCartItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setCartOpen((open) => !open);
  }, []);

  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  return {
    cartItems,
    cartOpen,
    setCartOpen,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
    totalCartCount
  };
}
