import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface WishlistStore {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        const { items } = get();
        if (!items.includes(productId)) {
          set({ items: [...items, productId] });
          toast.success('Added to wishlist', { icon: '❤️' });
        }
      },
      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(id => id !== productId) });
        toast.info('Removed from wishlist');
      },
      hasItem: (productId) => {
        return get().items.includes(productId);
      },
      clearWishlist: () => {
        set({ items: [] });
      }
    }),
    {
      name: 'aureva-wishlist',
    }
  )
);
