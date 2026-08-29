/** Mirrors com.monokek.catalog.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface ModifierItemDto {
    id: number;
    name: string;
    price: number;
}

export interface ModifierDto {
    id: number;
    name: string;
    type: 'accompaniment' | 'supplement';
    required: boolean;
    minSelect: number;
    maxSelect: number | null;
    items: ModifierItemDto[];
}

export interface ProductDto {
    id: number;
    categoryId: number;
    categoryName: string;
    branchId: number | null;
    sku: string | null;
    name: string;
    description: string | null;
    price: number;
    purchasePrice: number | null;
    incentiveAmount: number;
    formattedPrice: string;
    active: boolean;
    trackStock: boolean;
    stockCount: number;
    alertStock: number;
    type: string;
    image: string | null;
    modifiers: ModifierDto[];
}

export interface CategoryDto {
    id: number;
    branchId: number;
    kitchenStationId: number | null;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    active: boolean;
}

export interface CreateCategoryRequestDto {
    branchId: number;
    name: string;
    description?: string;
    icon?: string;
    kitchenStationId?: number;
}

export interface UpdateCategoryRequestDto {
    name?: string;
    description?: string;
    icon?: string;
    kitchenStationId?: number;
    active?: boolean;
}

export interface CreateProductRequestDto {
    categoryId: number;
    name: string;
    sku?: string;
    price: number;
    purchasePrice?: number;
    incentiveAmount?: number;
    stockCount?: number;
    alertStock?: number;
    type: string;
    trackStock?: boolean;
    image?: string;
    description?: string;
}

/** stockCount is deliberately absent — the product edit form can no longer move stock directly,
 * see AdjustProductStockRequestDto/adjustProductStock for the only remaining path. */
export interface UpdateProductRequestDto {
    categoryId?: number;
    name?: string;
    sku?: string;
    price?: number;
    purchasePrice?: number;
    incentiveAmount?: number;
    alertStock?: number;
    type?: string;
    trackStock?: boolean;
    active?: boolean;
    image?: string;
    description?: string;
}

/** type is 'in' | 'out' | 'adjust'. For 'in'/'out', qty is the quantity moved. For 'adjust', qty is
 * the new absolute stock count from a physical count — the backend computes and records the delta. */
export interface AdjustProductStockRequestDto {
    type: 'in' | 'out' | 'adjust';
    qty: number;
    reason?: string;
}

export interface ProductStockMovementDto {
    id: number;
    productId: number;
    type: 'in' | 'out' | 'adjust';
    qty: number;
    reason: string | null;
    authorId: number;
    authorName: string;
    createdAt: string | null;
}

export interface BulkImportLineDto {
    name: string;
    price: number;
    category: string;
}

export interface BulkImportRequestDto {
    branchId: number;
    items: BulkImportLineDto[];
}

export interface CreateModifierRequestDto {
    name: string;
    type?: 'accompaniment' | 'supplement';
    required?: boolean;
    minSelect?: number;
    maxSelect?: number;
    items?: { name: string; price: number }[];
}

export interface UpdateModifierRequestDto {
    name: string;
    type?: 'accompaniment' | 'supplement';
    required?: boolean;
    minSelect?: number;
    maxSelect?: number;
}

export interface CreateModifierItemRequestDto {
    name: string;
    price: number;
}
