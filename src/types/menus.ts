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
    os_printer_name: string; // Nom CUPS/Windows de l'imprimante — usb uniquement
}
export interface Printer extends PrinterFormValues {
    id: number | string;
    status?: 'online' | 'offline';
}
export interface Modifier {
    id: number;
    name: string; // ex: "Cuisson", "Suppléments"
    type: 'accompaniment' | 'supplement';
    required: boolean;
    minSelect: number;
    maxSelect: number | null;
    items: ModifierItem[];
}

export interface Product {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    price: number;
    purchase_price: number | null;
    incentive_amount:number;
    formatted_price: string;
    // Le catalogue Spring n'expose que categoryId/categoryName/branchId sur ProductDto,
    // pas une Category complète — voir lib/api/catalog.ts.
    category: { id: number; name: string; branch_id: number | null };
    modifiers: Modifier[];
    is_active: boolean;
    track_stock: boolean;
    stock_count: number;
    alert_stock: number;
    type: string;
    image_url: string | null;
}

export interface Category {
    id: number | null;
    name: string;
    branch_id: number;
    /** Succursales qui utilisent la catégorie (la sienne seule tant qu'elle n'est pas partagée). */
    branch_ids?: number[];
    /** Station de cuisine de CHAQUE succursale qui utilise la catégorie. */
    branch_stations?: Record<number, number | null>;
    kitchen_station_id: number | null;
    slug: string;
    description?: string;
    icon?: string;
    is_active: boolean;
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
    // Le catalogue Spring n'expose product/variant que sous forme de référence imbriquée
    // {id, name} sur OrderDto.ItemDto — pas de product_id/variant_id/variant_name à plat.
    product: {
        id: number;
        name: string;
    };
    variant?: {
        id: number;
        name: string;
    } | null;
    qty: number;
    price: number;
    total: number;
    status: 'pending' | 'preparing' | 'served' | 'cancelled';
    modifiers?: OrderItemModifier[];
    formatted_total?: string;
}

export interface Round {
    id: number;
    round_number: number;
    status: string;
    note?: string | null;
    sent_at: string | null;
    items?: OrderItem[];
    total_round?: number;
    void_reason?: string | null;
}
export interface Order {
    id: number;
    uuid: string;
    reference: string;

    type: OrderType;
    status: OrderStatus;

    // Montants
    amounts: {
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
        formatted_total: string;
        coupon_code: string | null;
    };

    // Relations — OrderDto n'expose que des références imbriquées, pas de
    // branch_id/table_id/user_id/customer_id à plat (aucun composant ne les lisait).
    rounds?: Round[];
    table?: {
        id: number;
        name: string;
        status?: string;
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
    } | null;
    note?: string | null;
    created_at: string; // Vient de OrderDto.time (format "H:i")
    date: string;       // Format "d/m/Y"
}

export interface Reservation {
    id: number;
    pickup_date: string | null;
    guests_count: number;
    manager_notes: string | null;
    reservation_status: string;
    customer: { id: number; name: string; phone: string } | null;
    // order.items est synthétisé (flatMap des rounds) pour les composants qui
    // affichent la commande de réservation à plat — voir lib/api/ordering.ts.
    order: (Order & { items: OrderItem[] }) | null;
    created_at: string;
    updated_at: string;
}

export interface Commission {
    id: number;
    amount: number;
    percentage: number | null;
    type: string;
    status: string;
    created_at: string;
    waiter_id: number;
    waiter_name: string;
    order_reference: string;
    product_name: string;
    is_incentive: boolean;
    status_label: string;
}
