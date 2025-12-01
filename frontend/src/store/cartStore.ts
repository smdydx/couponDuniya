import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { MAXIMUM_CART_QUANTITY } from '@/lib/constants';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  useWalletBalance: boolean;
  walletAmountToUse: number;

  // Computed
  itemCount: number;
  subtotal: number;
  total: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  setPromoCode: (code: string | null, discount: number) => void;
  setUseWalletBalance: (use: boolean, amount: number) => void;
  getItemByVariantId: (variantId: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      useWalletBalance: false,
      walletAmountToUse: 0,

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
      },

      get total() {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
        return Math.max(0, subtotal - state.promoDiscount - state.walletAmountToUse);
      },

      addItem: (item: CartItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            const newQuantity = Math.min(existing.quantity + item.quantity, MAXIMUM_CART_QUANTITY);
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: Math.min(item.quantity, MAXIMUM_CART_QUANTITY) }] };
        });
      },

      removeItem: (variantId: number) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.min(quantity, MAXIMUM_CART_QUANTITY) } : i
          ),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          promoCode: null,
          promoDiscount: 0,
          useWalletBalance: false,
          walletAmountToUse: 0,
        });
      },

      setPromoCode: (code: string | null, discount: number) => {
        set({ promoCode: code, promoDiscount: discount });
      },

      setUseWalletBalance: (use: boolean, amount: number) => {
        set({ useWalletBalance: use, walletAmountToUse: use ? amount : 0 });
      },

      getItemByVariantId: (variantId: number) => {
        return get().items.find((i) => i.variantId === variantId);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        promoDiscount: state.promoDiscount,
      }),
    }
  )
);
