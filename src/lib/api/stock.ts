import api from '../axios';
import { unwrapRaw } from './http';

// ---------------------------------------------------------------------------
// Lieux de stock : l'entrepôt général + un lieu par succursale
// ---------------------------------------------------------------------------

export interface StockLocation {
    id: number;
    kind: 'WAREHOUSE' | 'BRANCH';
    name: string;
    /** Succursale dont les comptes gèrent le lieu (null pour l'entrepôt tant qu'il n'est pas rattaché). */
    branchId: number | null;
}

/** Lieux que le compte connecté peut atteindre : tous pour le propriétaire, le sien seul pour un compte de succursale / d'entrepôt. */
export async function listStockLocations(): Promise<StockLocation[]> {
    const response = await api.get('/api/admin/stock-locations');
    return unwrapRaw<StockLocation[]>(response);
}

/** Succursales qu'un fournisseur (propriétaire ou magasinier) peut approvisionner. */
export interface TransferDestination {
    branchId: number;
    name: string;
}

export async function listTransferDestinations(): Promise<TransferDestination[]> {
    const response = await api.get('/api/admin/stock-locations/destinations');
    return unwrapRaw<TransferDestination[]>(response);
}

/** Propriétaire : rattache l'entrepôt à la succursale dont les magasiniers sont les comptes. */
export async function linkWarehouse(branchId: number): Promise<StockLocation> {
    const response = await api.put('/api/admin/stock-locations/warehouse', { branchId });
    return unwrapRaw<StockLocation>(response);
}

/**
 * Ce que voit le compte connecté. Déduit des lieux atteignables, sans dépendre d'un `branch_id` en session :
 * plusieurs lieux = propriétaire ; l'entrepôt seul = magasinier ; un lieu de succursale = compte de succursale.
 */
export type StockScope = 'owner' | 'warehouse' | 'branch';

export function stockScopeOf(locations: StockLocation[]): StockScope {
    if (locations.length > 1) return 'owner';
    if (locations[0]?.kind === 'WAREHOUSE') return 'warehouse';
    return locations.length === 1 ? 'branch' : 'owner';
}

// ---------------------------------------------------------------------------
// Articles d'un lieu : ingrédients (toujours le stock central) + produits du lieu
// ---------------------------------------------------------------------------

export interface StockIngredientRow {
    id: number;
    name: string;
    stock: number;
    alertQty: number;
    unit: string;
    isLowStock: boolean;
}

export interface StockProductRow {
    id: number;
    name: string;
    sku: string | null;
    qty: number;
    alertQty: number;
    isLowStock: boolean;
}

export interface StockItems {
    locationId: number;
    locationName: string;
    /** Où sont les quantités d'ingrédients : toujours l'entrepôt. */
    ingredientsLocationId: number;
    ingredients: StockIngredientRow[];
    products: StockProductRow[];
}

export async function listStockItems(locationId?: number): Promise<StockItems> {
    const response = await api.get('/api/admin/stock-items', { params: { locationId } });
    return unwrapRaw<StockItems>(response);
}

/** Entrée / sortie / comptage d'un PRODUIT à un lieu précis (le propriétaire choisit le lieu ; un compte de succursale agit sur le sien). */
export async function adjustProductStockAt(
    productId: number, payload: { type: 'in' | 'out' | 'adjust'; qty: number; reason?: string }, locationId?: number,
): Promise<void> {
    await api.post(`/api/admin/products/${productId}/stock/adjust`, payload, { params: { locationId } });
}
