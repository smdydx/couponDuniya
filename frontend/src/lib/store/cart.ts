import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: number;
  variant_id?: number;
  quantity: number;
  // UI fields (not sent to API)
  product_name?: string;
  variant_name?: string;
  unit_price?: number;
  image_url?: string;
  merchant_name?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getItem: (productId: number, variantId?: number) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.product_id === item.product_id &&
              i.variant_id === item.variant_id
          );

          if (existingIndex >= 0) {
            // Update quantity
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            return { items: newItems };
          }

          // Add new item
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product_id === productId &&
                item.variant_id === variantId
              )
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId && item.variant_id === variantId
              ? { ...item, quantity }
              : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getItem: (productId, variantId) => {
        const state = get();
        return state.items.find(
          (item) =>
            item.product_id === productId && item.variant_id === variantId
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
