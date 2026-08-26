/** Mirrors com.monokek.inventory.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface SupplierDto {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    contactName: string | null;
}

export interface CreateSupplierRequest {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    contactName?: string;
}

export interface UpdateSupplierRequest {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    contactName?: string;
}

/** Mirrors com.monokek.inventory.web.dto.PurchaseOrderDto. */
export interface PurchaseOrderLineDto {
    id: number;
    ingredientId: number | null;
    ingredientName: string | null;
    productId: number | null;
    productName: string | null;
    qty: number;
    price: number;
}

export interface PurchaseOrderDto {
    id: number;
    supplierId: number;
    supplierName: string;
    status: string;
    total: number;
    createdAt: string | null;
    items: PurchaseOrderLineDto[];
}

/** Exactly one of ingredientId/productId must be set per line — validated server-side. */
export interface CreatePurchaseOrderLineDto {
    ingredientId?: number;
    productId?: number;
    qty: number;
    price: number;
}

export interface CreatePurchaseOrderRequest {
    supplierId: number;
    items: CreatePurchaseOrderLineDto[];
}
