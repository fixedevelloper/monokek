/** Mirrors com.monokek.catalog.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface ModifierItemDto {
    id: number;
    name: string;
    price: number;
}

export interface ModifierDto {
    id: number;
    name: string;
    items: ModifierItemDto[];
}

export interface ProductDto {
    id: number;
    categoryId: number;
    categoryName: string;
    sku: string | null;
    name: string;
    description: string | null;
    price: number;
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
    incentiveAmount?: number;
    stockCount?: number;
    alertStock?: number;
    type: string;
    trackStock?: boolean;
    image?: string;
    description?: string;
}

export interface UpdateProductRequestDto {
    categoryId?: number;
    name?: string;
    sku?: string;
    price?: number;
    incentiveAmount?: number;
    stockCount?: number;
    alertStock?: number;
    type?: string;
    trackStock?: boolean;
    active?: boolean;
    image?: string;
    description?: string;
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
    items?: { name: string; price: number }[];
}

export interface UpdateModifierRequestDto {
    name: string;
}

export interface CreateModifierItemRequestDto {
    name: string;
    price: number;
}
