import api from '../axios';
import { unwrapRaw } from './http';

// Catalogue commun : quelles succursales vendent un produit / utilisent une catégorie. Réservé au propriétaire (ADMIN sans succursale).

export interface ProductBranchRow {
    branchId: number;
    active: boolean;
    /** Prix local ; null = prix de base du produit. */
    priceOverride: number | null;
}

export interface CategoryBranchRow {
    branchId: number;
    kitchenStationId: number | null;
    active: boolean;
}

export async function listProductBranches(productId: number): Promise<ProductBranchRow[]> {
    return unwrapRaw<ProductBranchRow[]>(await api.get(`/api/admin/products/${productId}/branches`));
}

export async function saveProductBranch(
    productId: number, branchId: number, payload: { active?: boolean; priceOverride?: number | null },
): Promise<ProductBranchRow> {
    return unwrapRaw<ProductBranchRow>(await api.put(`/api/admin/products/${productId}/branches/${branchId}`, payload));
}

export async function removeProductBranch(productId: number, branchId: number): Promise<void> {
    await api.delete(`/api/admin/products/${productId}/branches/${branchId}`);
}

export async function listCategoryBranches(categoryId: number): Promise<CategoryBranchRow[]> {
    return unwrapRaw<CategoryBranchRow[]>(await api.get(`/api/admin/categories/${categoryId}/branches`));
}

export async function saveCategoryBranch(
    categoryId: number, branchId: number, payload: { kitchenStationId?: number | null; active?: boolean },
): Promise<CategoryBranchRow> {
    return unwrapRaw<CategoryBranchRow>(await api.put(`/api/admin/categories/${categoryId}/branches/${branchId}`, payload));
}

export async function removeCategoryBranch(categoryId: number, branchId: number): Promise<void> {
    await api.delete(`/api/admin/categories/${categoryId}/branches/${branchId}`);
}
