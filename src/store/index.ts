import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/data';

// ── Cart ──────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
  selectedFabric?: string;
  customNote?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string) => void;
  updateQuantity: (productId: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const existing = get().items.find(
          (i) => i.product.id === newItem.product.id && i.selectedColor === newItem.selectedColor
        );
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === newItem.product.id && i.selectedColor === newItem.selectedColor
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          }));
        } else {
          set((state) => ({ items: [...state.items, newItem] }));
        }
        set({ isOpen: true });
      },

      removeItem: (productId, color) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.selectedColor === color)
          ),
        }));
      },

      updateQuantity: (productId, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.selectedColor === color
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'zhua-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ── Wishlist ──────────────────────────────────────────────────────────

interface WishlistStore {
  ids: string[];
  hydrated: boolean;
  setIds: (ids: string[]) => void;
  init: () => Promise<void>;
  toggle: (id: string) => Promise<void>;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      setIds: (ids) => set({ ids }),
      init: async () => {
        if (get().hydrated) {
          return;
        }

        set({ hydrated: true });

        try {
          const res = await fetch('/api/account/wishlist', { cache: 'no-store' });
          if (!res.ok) {
            return;
          }

          const data = (await res.json()) as { ids?: string[] };
          if (Array.isArray(data.ids)) {
            set({ ids: data.ids });
          }
        } catch {
          // Guests or transient network issues should keep local persisted state.
        }
      },
      toggle: async (id) => {
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((entry) => entry !== id)
            : [...state.ids, id],
        }));

        try {
          const res = await fetch('/api/account/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, mode: 'toggle' }),
          });

          if (!res.ok) {
            return;
          }

          const data = (await res.json()) as { ids?: string[] };
          if (Array.isArray(data.ids)) {
            set({ ids: data.ids });
          }
        } catch {
          // Keep optimistic local state when remote sync fails.
        }
      },
      has: (id) => get().ids.includes(id),
    }),
    {
      name: 'zhua-wishlist',
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);

// ── Search ────────────────────────────────────────────────────────────

interface SearchStore {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
}

export const useSearchStore = create<SearchStore>()((set) => ({
  isOpen: false,
  query: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  setQuery: (q) => set({ query: q }),
}));
