import { create } from 'zustand';

interface ReservationState {
    formData: {
        customer_name: string;
        customer_phone: string;
        pickup_date: string;
        guests_count: number;
        manager_notes: string;
    };
    selectedItems: any[];

    // Actions
    setField: (field: string, value: any) => void;
    updateQty: (product: any, delta: number) => void;
    initReservation: (reservation: any | null) => void;
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
        const productId = product.id || product.product_id;
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
            set({ selectedItems: [...selectedItems, { ...product, product_id: productId, quantity: 1 }] });
        }
    },

    initReservation: (res) => {
        if (res) {
            set({
                formData: {
                    customer_name: res.customer?.name || "",
                    customer_phone: res.customer?.phone || "",
                    pickup_date: res.pickup_date?.substring(0, 16) || "",
                    guests_count: res.guests_count || 1,
                    manager_notes: res.manager_notes || ""
                },
                selectedItems: res.order?.items || []
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
            acc + (item.price || item.unit_price) * item.quantity, 0
        );
    }
}));