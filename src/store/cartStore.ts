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
    logoSize?: string;
    customText?: string;
    charge: number;
  };
}

interface CartState {
  items: CartItem[];
  appliedCoupon: any | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCoupon: (coupon: any | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubTotal: () => number;
  getGstTotal: () => number;
  getDiscount: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      setCoupon: (coupon) => set({ appliedCoupon: coupon }),
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
      clearCart: () => set({ items: [], appliedCoupon: null }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubTotal: () => get().items.reduce((total, item) => {
        const itemPrice = item.basePrice + (item.customization?.charge || 0);
        return total + (itemPrice * item.quantity);
      }, 0),
      getGstTotal: () => get().items.reduce((total, item) => {
        const itemPrice = item.basePrice + (item.customization?.charge || 0);
        return total + ((itemPrice * (item.gstPercent / 100)) * item.quantity);
      }, 0),
      getDiscount: () => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        const subtotal = get().getSubTotal();
        if (subtotal < (coupon.minPurchase || 0)) return 0;
        
        if (coupon.discountType === 'percentage') {
          return subtotal * (coupon.discountValue / 100);
        } else {
          return coupon.discountValue;
        }
      },
      getGrandTotal: () => {
        const subtotal = get().getSubTotal();
        const gst = get().getGstTotal();
        const discount = get().getDiscount();
        return Math.max(0, subtotal + gst - discount); // could add delivery charges here as well
      }
    }),
    {
      name: 'aureva-cart-storage',
    }
  )
);
