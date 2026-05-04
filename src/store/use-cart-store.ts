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
    quantity: number;
  }>;
  instructions?: string;
}

type Totals = {
  subtotal: number;
  tax: number;
  total: number;
};

interface CartState {
  tableId: number | null;
  orderId: number | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  initCartForTable: (tableId: number, existingOrder?: any) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
}

// ✅ Fonction corrigée
const computeTotals = (items: CartItem[], discount = 0): Totals => {
  const subtotal = items.reduce((acc, item) => {
    const modifiersTotal = item.modifiers.reduce((mAcc, m) => {
      return mAcc + (Number(m.price) * (m.quantity || 1));
    }, 0);

    const unitPrice = Number(item.price) + modifiersTotal;
    return acc + unitPrice * item.qty;
  }, 0);

  const tax = subtotal * 0.1925;
  const total = subtotal + tax - discount;

  return { subtotal, tax, total };
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
          tableId: null,
          orderId: null,
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,

          initCartForTable: (tableId, existingOrder = null) => {
            if (existingOrder && existingOrder.items) {
              const loadedItems = existingOrder.items.map((item: any) => ({
                id: `${item.product_id}-${item.variant_id || 0}-${item.modifiers?.map((m: any) => m.modifier_item_id).sort().join(',') || ''}`,
                product_id: item.product_id || item.product?.id,
                name: item.product?.name || "Produit",
                qty: item.qty || 1,
                price: parseFloat(item.price || 0),
                modifiers: item.modifiers?.map((m: any) => ({
                  id: m.modifier_item_id,
                  name: m.modifier_item?.name || "Supplément",
                  price: parseFloat(m.price || 0),
                  quantity: m.quantity || 1
                })) || [],
              }));

              const discount = 0;

              set({
                tableId,
                orderId: existingOrder.id,
                items: loadedItems,
                discount,
                ...computeTotals(loadedItems, discount)
              });
            } else {
              set({
                tableId,
                orderId: existingOrder?.id || null,
                items: [],
                subtotal: 0,
                tax: 0,
                discount: 0,
                total: 0
              });
            }
          },

          addItem: (newItem) => {
            const { items, discount } = get();

            const modifierKey = newItem.modifiers
                .map(m => `${m.id}-q${m.quantity}`)
                .sort()
                .join('|');

            const uniqueId = `${newItem.product_id}-${modifierKey}`;
            const existingItem = items.find(i => i.id === uniqueId);

            let newItems;

            if (existingItem) {
              newItems = items.map(i =>
                  i.id === uniqueId ? { ...i, qty: i.qty + 1 } : i
              );
            } else {
              newItems = [...items, { ...newItem, id: uniqueId }];
            }

            set({
              items: newItems,
              ...computeTotals(newItems, discount)
            });
          },

          updateQty: (id, qty) => {
            const { items, discount } = get();

            const newItems =
                qty <= 0
                    ? items.filter(i => i.id !== id)
                    : items.map(i => i.id === id ? { ...i, qty } : i);

            set({
              items: newItems,
              ...computeTotals(newItems, discount)
            });
          },

          removeItem: (id) => {
            const { items, discount } = get();
            const newItems = items.filter(i => i.id !== id);

            set({
              items: newItems,
              ...computeTotals(newItems, discount)
            });
          },

          applyDiscount: (amount: number) => {
            const { items } = get();

            set({
              discount: amount,
              ...computeTotals(items, amount)
            });
          },

          clearCart: () =>
              set({
                items: [],
                subtotal: 0,
                tax: 0,
                discount: 0,
                total: 0
              }),
        }),
        {
          name: 'mono-kek-cart-storage',
        }
    )
);