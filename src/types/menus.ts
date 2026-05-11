export interface ModifierItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}
export interface PrinterFormValues {
    name: string;
    type: string;
    connection: string;
    ip: string;
    port: number;
    branch_id: number;
    location: string;      // Ajouté pour le typage
    paper_width: string;   // Ajouté pour le typage
    char_per_line: number; // Ajouté pour le typage
    use_beep: boolean;     // Ajouté pour le typage
}
export interface Printer extends PrinterFormValues {
    id: number | string;
}
export interface Modifier {
    id: number;
    name: string; // ex: "Cuisson", "Suppléments"
    items: ModifierItem[];
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    description: string;
    price: number;
    incentive_amount:number;
    formatted_price: string;
    category: Category;
    modifiers: Modifier[];
    is_active: boolean;
    track_stock: boolean;
    stock_count: number;
    alert_stock: number;
    type: string;
    image_url: string;
    created_at: string;
}

export interface Category {
    id: number | null;
    name: string;
    branch_id: number;
    slug: string;
    description?: string;
    icon?: string;
    is_active: boolean;
    created_at: string;
}


export type OrderStatus =
    'draft'
    | 'pending'
    | 'pending_payment'
    | 'paid'
    | 'completed'
    | 'cancelled'
    | 'billing'
    | 'ready'
    | 'reserved'
    | 'preparing';
export type OrderType = 'dinein' | 'takeaway' | 'delivery';

export interface OrderItemModifier {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export interface OrderItem {
    id: number;
    product_id: number;
    product: {
        id: number;
        name: string;
    }; // Vient de la Resource
    variant_id?: number | null;
    variant_name?: string | null;
    qty: number;
    price: number;
    total: number;
    status: 'pending' | 'preparing' | 'served' | 'cancelled';
    modifiers?: OrderItemModifier[];
}

export interface Round {
    id: number;
    order_id: number;
    round_number: number;
    status: string;
    sent_at: string;
    sent_at_formatted?: string; // Formaté par le Resource Laravel (ex: "14:30")
    items?: OrderItem[];
}
export interface Order {
    id: number;
    uuid: string;
    reference: string;
    branch_id: number;
    table_id: number | null;
    user_id: number;
    customer_id?: number | null;

    type: OrderType;
    status: OrderStatus;

    // Montants
    amounts: {
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
        formatted_total: string;
    };

    // Relations
    rounds?: Round[];
    table?: {
        id: number;
        name: string;
        floor_name?: string;
    };
    waiter?: {
        id: number;
        name: string;
    };
    cashier?: {
        id: number;
        name: string;
    };
    customer?: {
        id: number;
        name: string;
    };
    note?: string | null;
    created_at: string; // Format "H:i"
    date: string;       // Format "d/m/Y"
}

// Utile pour la création d'une commande (Payload API)
export interface CreateOrderPayload {
    table_id: number | null;
    items: {
        product_id: number;
        variant_id?: number | null;
        qty: number;
        price: number;
        modifiers?: number[]; // IDs des modificateurs
    }[];
    subtotal: number;
    total: number;
    note?: string;
}