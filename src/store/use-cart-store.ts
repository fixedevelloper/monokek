import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  product_id: number;
  name: string;
  variant_id?: number;
  variant_name?: string;
  qty: number;
  price: number;
  modifiers: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  instructions?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
}

// Fonction utilitaire pour calculer les totaux à partir des items et du discount
const computeTotals = (items: CartItem[], discount: number) => {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const taxRate = 0; // À mettre à 0.1925 si tu veux appliquer la TVA
  const tax = subtotal * taxRate;
  const total = subtotal + tax - discount;
  return { subtotal, tax, total };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,

      addItem: (newItem) => {
        const { items, discount } = get();
        const modifierIds = newItem.modifiers.map(m => m.id).sort().join(',');
        const uniqueId = `${newItem.product_id}-${newItem.variant_id || 0}-${modifierIds}`;

        const existingItemIndex = items.findIndex(i => i.id === uniqueId);
        let newItems;

        if (existingItemIndex > -1) {
          newItems = items.map((item, index) => 
            index === existingItemIndex ? { ...item, qty: item.qty + newItem.qty } : item
          );
        } else {
          newItems = [...items, { ...newItem, id: uniqueId }];
        }

        set({ items: newItems, ...computeTotals(newItems, discount) });
      },

      removeItem: (id) => {
        const { items, discount } = get();
        const newItems = items.filter(i => i.id !== id);
        set({ items: newItems, ...computeTotals(newItems, discount) });
      },

      updateQty: (id, qty) => {
        
        const { items, discount } = get();
        if (qty <= 0) return get().removeItem(id);
        
        const newItems = items.map(i => i.id === id ? { ...i, qty } : i);
        set({ items: newItems, ...computeTotals(newItems, discount) });
      },

      applyDiscount: (amount) => {
        const { items } = get();
        set({ discount: amount, ...computeTotals(items, amount) });
      },

      clearCart: () => set({ items: [], subtotal: 0, tax: 0, discount: 0, total: 0 }),
    }),
    {
      name: 'mono-kek-cart-storage',
    }
  )
);