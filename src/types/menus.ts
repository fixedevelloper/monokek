export interface ModifierItem {
  id: number;
  name: string;
  price: number;
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
  formatted_price: string;
  category: Category;
modifiers: Modifier[];
  is_active: boolean;
  track_stock: boolean;
  stock_count: number;
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


export type OrderStatus = 'draft' | 'pending' | 'pending_payment' | 'paid' | 'completed' | 'cancelled' | 'billing'| 'ready'| 'preparing';
export type OrderType = 'dinein' | 'takeaway' | 'delivery';

export interface OrderItemModifier {
    id: number;
    name: string;
    price: number;
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
    items?: OrderItem[];
    table?: {
        id: number;
        name: string;
        floor_name?: string;
    };
    waiter?: {
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