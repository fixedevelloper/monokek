import api from '../axios';
import { SpringPage, unwrapRaw } from './http';
import {
    AdjustProductStockRequestDto,
    BulkImportRequestDto,
    CategoryDto,
    CreateCategoryRequestDto,
    CreateModifierItemRequestDto,
    CreateModifierRequestDto,
    CreateProductRequestDto,
    ModifierDto,
    ProductDto,
    ProductStockMovementDto,
    UpdateCategoryRequestDto,
    UpdateModifierRequestDto,
    UpdateProductRequestDto,
} from './types/catalog';
import { Category, Modifier, Product } from '@/src/types/menus';

export function mapProductDtoToProduct(dto: ProductDto): Product {
    return {
        id: dto.id,
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        price: dto.price,
        purchase_price: dto.purchasePrice,
        incentive_amount: dto.incentiveAmount,
        formatted_price: dto.formattedPrice,
        category: { id: dto.categoryId, name: dto.categoryName, branch_id: dto.branchId },
        modifiers: dto.modifiers.map(mapModifierDtoToModifier),
        is_active: dto.active,
        track_stock: dto.trackStock,
        stock_count: dto.stockCount,
        alert_stock: dto.alertStock,
        type: dto.type,
        image_url: dto.image,
    };
}

export function mapModifierDtoToModifier(dto: ModifierDto): Modifier {
    return {
        id: dto.id,
        name: dto.name,
        type: dto.type,
        required: dto.required,
        minSelect: dto.minSelect,
        maxSelect: dto.maxSelect,
        items: dto.items.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: 1 })),
    };
}

export function mapCategoryDtoToCategory(dto: CategoryDto): Category {
    return {
        id: dto.id,
        name: dto.name,
        branch_id: dto.branchId,
        branch_ids: dto.branchSettings?.map((s) => s.branchId) ?? [dto.branchId],
        branch_stations: Object.fromEntries((dto.branchSettings ?? []).map((s) => [s.branchId, s.kitchenStationId])),
        kitchen_station_id: dto.kitchenStationId,
        slug: dto.slug,
        description: dto.description ?? undefined,
        icon: dto.icon ?? undefined,
        is_active: dto.active,
    };
}

export async function listProductsPos(categoryId?: number, search?: string): Promise<Product[]> {
    const response = await api.get('/api/pos/products', { params: { categoryId, search } });
    return unwrapRaw<ProductDto[]>(response).map(mapProductDtoToProduct);
}

export async function listProductsAdmin(categoryId?: number, search?: string): Promise<Product[]> {
    const response = await api.get('/api/admin/products', { params: { categoryId, search } });
    return unwrapRaw<ProductDto[]>(response).map(mapProductDtoToProduct);
}

/** Paginated — backs the admin menu's infinite-scroll grid (one branch section at a time). */
export async function listProductsAdminPage(params: {
    branchId: number;
    categoryId?: number;
    search?: string;
    page: number;
    size?: number;
}): Promise<SpringPage<Product>> {
    const { branchId, categoryId, search, page, size = 20 } = params;
    const response = await api.get('/api/admin/products/page', { params: { branchId, categoryId, search, page, size } });
    const raw = unwrapRaw<SpringPage<ProductDto>>(response);
    return { ...raw, content: raw.content.map(mapProductDtoToProduct) };
}

export async function createProduct(payload: CreateProductRequestDto): Promise<Product> {
    const response = await api.post('/api/admin/products', payload);
    return mapProductDtoToProduct(unwrapRaw(response));
}

export async function updateProduct(id: number, payload: UpdateProductRequestDto): Promise<Product> {
    const response = await api.patch(`/api/admin/products/${id}`, payload);
    return mapProductDtoToProduct(unwrapRaw(response));
}

export async function deleteProduct(id: number): Promise<void> {
    await api.delete(`/api/admin/products/${id}`);
}

/** The only way left to move a product's stock — admin-only, always traced (see ProductStockMovementDto). */
export async function adjustProductStock(productId: number, payload: AdjustProductStockRequestDto, locationId?: number): Promise<Product> {
    // locationId : le lieu de stock concerné. Un compte de succursale agit sur le sien ; le propriétaire doit le préciser dès que le produit
    // est vendu dans plusieurs succursales (le serveur répond 400 sinon).
    const response = await api.post(`/api/admin/products/${productId}/stock/adjust`, payload, { params: { locationId } });
    return mapProductDtoToProduct(unwrapRaw(response));
}

export async function listProductStockMovements(productId: number, locationId?: number): Promise<ProductStockMovementDto[]> {
    const response = await api.get(`/api/admin/products/${productId}/stock/movements`, { params: { locationId } });
    return unwrapRaw<ProductStockMovementDto[]>(response);
}

export async function bulkImportProducts(payload: BulkImportRequestDto): Promise<string> {
    const response = await api.post('/api/admin/products/bulk-import', payload);
    return unwrapRaw<{ message: string }>(response).message;
}

export async function syncModifiers(productId: number, modifierIds: number[]): Promise<void> {
    await api.post(`/api/admin/products/${productId}/sync-modifiers`, { modifierIds });
}

export async function listCategoriesPos(): Promise<Category[]> {
    const response = await api.get('/api/pos/categories');
    return unwrapRaw<CategoryDto[]>(response).map(mapCategoryDtoToCategory);
}

export async function listCategoriesAdmin(): Promise<Category[]> {
    const response = await api.get('/api/admin/categories');
    return unwrapRaw<CategoryDto[]>(response).map(mapCategoryDtoToCategory);
}

export async function createCategory(payload: CreateCategoryRequestDto): Promise<Category> {
    const response = await api.post('/api/admin/categories', payload);
    return mapCategoryDtoToCategory(unwrapRaw(response));
}

export async function updateCategory(id: number, payload: UpdateCategoryRequestDto): Promise<Category> {
    const response = await api.put(`/api/admin/categories/${id}`, payload);
    return mapCategoryDtoToCategory(unwrapRaw(response));
}

export async function deleteCategory(id: number): Promise<void> {
    await api.delete(`/api/admin/categories/${id}`);
}

export async function listModifiers(): Promise<Modifier[]> {
    const response = await api.get('/api/admin/modifiers');
    return unwrapRaw<ModifierDto[]>(response).map(mapModifierDtoToModifier);
}

export async function createModifier(payload: CreateModifierRequestDto): Promise<Modifier> {
    const response = await api.post('/api/admin/modifiers', payload);
    return mapModifierDtoToModifier(unwrapRaw(response));
}

export async function updateModifier(id: number, payload: UpdateModifierRequestDto): Promise<Modifier> {
    const response = await api.put(`/api/admin/modifiers/${id}`, payload);
    return mapModifierDtoToModifier(unwrapRaw(response));
}

export async function deleteModifier(id: number): Promise<void> {
    await api.delete(`/api/admin/modifiers/${id}`);
}

export async function addModifierItem(groupId: number, payload: CreateModifierItemRequestDto): Promise<Modifier> {
    const response = await api.post(`/api/admin/modifiers/${groupId}/items`, payload);
    return mapModifierDtoToModifier(unwrapRaw(response));
}

export async function deleteModifierItem(itemId: number): Promise<void> {
    await api.delete(`/api/admin/modifier-items/${itemId}`);
}
