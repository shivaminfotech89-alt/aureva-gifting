import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  basePrice: number;
  gstPercent: number;
  quantity: number;
  image: string;
  customization?: {
    enabled: boolean;
    logoUrl?: string;
    customText?: string;
    charge: number;
  };
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubTotal: () => number;
  getGstTotal: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const cartItemId = item.customization?.enabled 
             ? `${item.productId}-custom-${Math.random().toString(36).substring(7)}` 
             : item.productId;
          
          item.productId = cartItemId;

          const existingItem = state.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubTotal: () => get().items.reduce((total, item) => {
        const itemPrice = item.basePrice + (item.customization?.charge || 0);
        return total + (itemPrice * item.quantity);
      }, 0),
      getGstTotal: () => get().items.reduce((total, item) => {
        const itemPrice = item.basePrice + (item.customization?.charge || 0);
        return total + ((itemPrice * (item.gstPercent / 100)) * item.quantity);
      }, 0),
      getGrandTotal: () => {
        const subtotal = get().getSubTotal();
        const gst = get().getGstTotal();
        return subtotal + gst; // could add delivery charges here as well
      }
    }),
    {
      name: 'aureva-cart-storage',
    }
  )
);
