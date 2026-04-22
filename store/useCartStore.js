"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './storage';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      discount: 0,
      adjustment: 0,
      
      // Actions
      addItem: (product, isWholesale) => {
        const { cart } = get();
        const price = isWholesale ? (product.wholesalePrice || 0) : (product.retailPrice || 0);
        
        const existingIndex = cart.findIndex(i => i.variantId === product.id);
        
        if (existingIndex > -1) {
          const updated = [...cart];
          updated[existingIndex] = { 
            ...updated[existingIndex], 
            quantity: updated[existingIndex].quantity + 1 
          };
          set({ cart: updated });
        } else {
          set({
            cart: [
              ...cart,
              {
                id: product.id,
                variantId: product.id,
                productId: product.productId,
                barcode: product.barcode,
                name: product.fullName,
                size: product.variantName,
                quantity: 1,
                price,
                discount: 0,
              },
            ],
          });
        }
      },

      removeItem: (id) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        }));
      },

      updateQty: (id, delta) => {
        set((state) => ({
          cart: state.cart
            .map((i) => {
              if (i.id === id) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
              }
              return i;
            })
            .filter((i) => i.quantity > 0),
        }));
      },

      setDiscount: (val) => set({ discount: parseFloat(val) || 0 }),
      setAdjustment: (val) => set({ adjustment: parseFloat(val) || 0 }),

      clearCart: () => set({ cart: [], discount: 0, adjustment: 0 }),

      // Calculated State
      getSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotal: () => {
        const { cart, discount, adjustment } = get();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = subtotal * (discount / 100);
        return Math.max(0, subtotal - discountAmount + adjustment);
      },

      getDiscountAmount: () => {
        const { cart, discount } = get();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return subtotal * (discount / 100);
      },

      getItemCount: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Sync pricing when wholesale mode toggles
      syncPrices: (isWholesale, flatVariants) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            const v = flatVariants.find((fv) => fv.id === item.variantId);
            if (!v) return item;
            return {
              ...item,
              price: isWholesale ? (v.wholesalePrice || 0) : (v.retailPrice || 0),
            };
          }),
        }));
      },
    }),
    {
      name: 'inzeedo-cart-storage',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({ 
        cart: state.cart,
        discount: state.discount,
        adjustment: state.adjustment
      }),
    }
  )
);
