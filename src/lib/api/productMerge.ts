import api from '../axios';
import { unwrapRaw } from './http';

// Fusion des produits en double (même SKU). Réservé au propriétaire (ADMIN sans succursale).

export interface DuplicateCandidate {
    id: number;
    name: string;
    price: number;
    active: boolean;
    categoryId: number;
    categoryName: string;
    homeBranchId: number | null;
    branchIds: number[];
    stockTotal: number;
    /** Lignes d'historique (commandes, achats, transferts) rattachées au produit. */
    usage: number;
}

export interface DuplicateGroup {
    sku: string;
    suggestedKeepId: number;
    products: DuplicateCandidate[];
}

export interface MergePlan {
    keepId: number;
    keepName: string;
    sku: string;
    merged: { id: number; name: string; effects: string[] }[];
    warnings: string[];
    blockers: string[];
    canMerge: boolean;
}

export async function listDuplicates(): Promise<DuplicateGroup[]> {
    return unwrapRaw<DuplicateGroup[]>(await api.get('/api/admin/catalog/duplicates'));
}

/** Simulation : ce que la fusion ferait, sans rien écrire. */
export async function previewMerge(keepProductId: number, mergeProductIds: number[]): Promise<MergePlan> {
    return unwrapRaw<MergePlan>(await api.post('/api/admin/catalog/duplicates/preview', { keepProductId, mergeProductIds }));
}

export async function mergeProducts(keepProductId: number, mergeProductIds: number[]): Promise<MergePlan> {
    return unwrapRaw<MergePlan>(await api.post('/api/admin/catalog/duplicates/merge', { keepProductId, mergeProductIds }));
}
