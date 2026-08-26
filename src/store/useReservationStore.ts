import { create } from 'zustand';
import { Product, Reservation } from '@/src/types/menus';
import { toDatetimeLocalValue } from '@/src/lib/formatDate';

interface ReservationFormData {
    customer_name: string;
    customer_phone: string;
    pickup_date: string;
    guests_count: number;
    manager_notes: string;
}

export interface SelectedReservationItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
}

interface ReservationState {
    formData: ReservationFormData;
    selectedItems: SelectedReservationItem[];

    // Actions
    setField: <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => void;
    updateQty: (product: Product, delta: number) => void;
    initReservation: (reservation: Reservation | null) => void;
    reset: () => void;
    getTotal: () => number;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
    formData: {
        customer_name: "",
        customer_phone: "",
        pickup_date: "",
        guests_count: 1,
        manager_notes: ""
    },
    selectedItems: [],

    setField: (field, value) =>
        set((state) => ({ formData: { ...state.formData, [field]: value } })),

    updateQty: (product, delta) => {
        const { selectedItems } = get();
        const productId = product.id;
        const existing = selectedItems.find(item => (item.id === productId || item.product_id === productId));

        if (existing) {
            const newQty = existing.quantity + delta;
            if (newQty <= 0) {
                set({ selectedItems: selectedItems.filter(item => (item.id !== productId && item.product_id !== productId)) });
            } else {
                set({
                    selectedItems: selectedItems.map(item =>
                        (item.id === productId || item.product_id === productId) ? { ...item, quantity: newQty } : item
                    )
                });
            }
        } else if (delta > 0) {
            set({ selectedItems: [...selectedItems, { id: productId, product_id: productId, name: product.name, price: product.price, quantity: 1 }] });
        }
    },

    initReservation: (res) => {
        if (res) {
            set({
                formData: {
                    customer_name: res.customer?.name || "",
                    customer_phone: res.customer?.phone || "",
                    pickup_date: toDatetimeLocalValue(res.pickup_date),
                    guests_count: res.guests_count || 1,
                    manager_notes: res.manager_notes || ""
                },
                // res.order.items vient de OrderItem (product.id / qty), pas de la forme
                // {product_id, quantity} attendue ici — on la reconstruit à la volée.
                selectedItems: (res.order?.items || []).map((item): SelectedReservationItem => ({
                    id: item.product?.id ?? 0,
                    product_id: item.product?.id ?? 0,
                    name: item.product?.name ?? "",
                    price: item.price,
                    quantity: item.qty,
                }))
            });
        } else {
            get().reset();
        }
    },

    reset: () => set({
        formData: { customer_name: "", customer_phone: "", pickup_date: "", guests_count: 1, manager_notes: "" },
        selectedItems: []
    }),

    getTotal: () => {
        return get().selectedItems.reduce((acc, item) =>
            acc + item.price * item.quantity, 0
        );
    }
}));