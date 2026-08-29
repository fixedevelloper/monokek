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

    // Ne réinitialise le panier local QUE si on change réellement de table.
    // Ne prend plus existingOrder en paramètre : cette fonction ne doit jamais
    // dépendre de la structure de la commande serveur (rounds imbriqués, etc.),
    // seulement décider "même table ou pas".
    initCartForTable: (tableId: number) => void;

    // Synchronise juste l'orderId courant avec le serveur (ex: après création
    // d'une commande sur envoi du 1er round). Ne touche JAMAIS à items/totaux :
    // le panier local représente uniquement le round en cours de composition,
    // pas les rounds déjà envoyés (ceux-là viennent de orderData.rounds côté UI).
    syncOrderId: (orderId: number | null) => void;

    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    applyDiscount: (amount: number) => void;
    clearCart: () => void;

    // À appeler quand une commande vient d'être payée (voir PaymentModal.tsx) — contrairement à
    // clearCart (appelé juste après l'envoi d'un round, où orderId doit être préservé pour que
    // le round suivant s'attache à la même commande), celui-ci remet aussi orderId à null : une
    // fois payée, il n'y a plus rien à quoi attacher un round supplémentaire. Prend l'id de la
    // commande PAYÉE (pas le tableId) et ne réinitialise que si elle correspond exactement à
    // l'orderId actuellement suivi par ce store — une table virtuelle/comptoir est réutilisée par
    // des commandes complètement différentes au fil de la journée : comparer seulement le tableId
    // aurait pu effacer un round en cours de composition (encore non envoyé) pour cette même table
    // à cause du paiement d'une commande plus ancienne et sans rapport.
    resetAfterPayment: (paidOrderId: number | null) => void;

    // Filet de sécurité pour un `orderId` déjà périmé au moment d'envoyer un round (résidu d'un
    // état persisté antérieur à resetAfterPayment, ou toute autre commande fermée entre-temps
    // sans passer par cette app) — le serveur répond alors 409 (Order#assertOpen). Contrairement
    // à resetAfterPayment, ne touche PAS aux items : le caissier ne doit pas perdre sa sélection,
    // juste pouvoir renvoyer le round une fois l'orderId périmé écarté. Voir PosContent.tsx.
    clearStaleOrderId: (tableId: number | null) => void;
}

const computeTotals = (items: CartItem[], discount = 0): Totals => {
    const subtotal = items.reduce((acc, item) => {
        const modifiersTotal = item.modifiers.reduce((mAcc, m) => {
            return mAcc + (Number(m.price) * (m.quantity || 1));
        }, 0);

        const unitPrice = Number(item.price) + modifiersTotal;
        return acc + unitPrice * item.qty;
    }, 0);

    const tax = 0;
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

            initCartForTable: (tableId) => {
                const current = get();

                // Même table qu'avant (ex: refetch en arrière-plan, retour sur la page,
                // événement temps réel) -> on ne touche à RIEN. Le panier en cours de
                // composition doit survivre à un refetch de la commande active.
                if (current.tableId === tableId) {
                    return;
                }

                // Changement réel de table -> on repart sur un panier propre.
                // orderId sera resynchronisé juste après via syncOrderId().
                set({
                    tableId,
                    orderId: null,
                    items: [],
                    subtotal: 0,
                    tax: 0,
                    discount: 0,
                    total: 0,
                });
            },

            syncOrderId: (orderId) => {
                const current = get();
                if (current.orderId === orderId) return; // évite un set() inutile
                set({ orderId });
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

            resetAfterPayment: (paidOrderId) => {
                const current = get();
                if (paidOrderId == null || current.orderId !== paidOrderId) return;
                set({
                    orderId: null,
                    items: [],
                    subtotal: 0,
                    tax: 0,
                    discount: 0,
                    total: 0
                });
            },

            clearStaleOrderId: (tableId) => {
                const current = get();
                if (tableId != null && current.tableId !== tableId) return;
                set({ orderId: null });
            },
        }),
        {
            name: 'mono-kek-cart-storage',
        }
    )
);