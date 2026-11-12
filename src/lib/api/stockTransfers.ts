import api from '../axios';
import { unwrapRaw } from './http';

export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

export interface TransferPlace {
    id: number;
    name: string;
    branchId: number | null;
}

export interface TransferLine {
    id: number;
    type: 'INGREDIENT' | 'PRODUCT';
    itemId: number;
    name: string;
    unit: string;
    qtyRequested: number;
    /** Ce qui a quitté l'entrepôt (null tant que non expédié). */
    qtyShipped: number | null;
    /** Ce que la succursale a compté (null tant que non reçu). */
    qtyReceived: number | null;
}

export interface StockTransfer {
    id: number;
    reference: string;
    status: TransferStatus;
    from: TransferPlace;
    to: TransferPlace;
    note: string | null;
    requestedBy: number;
    requestedByName: string | null;
    createdAt: string | null;
    approvedAt: string | null;
    shippedAt: string | null;
    receivedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    hasDiscrepancy: boolean;
    lines: TransferLine[];
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
    REQUESTED: 'Demandé',
    APPROVED: 'Approuvé',
    SHIPPED: 'En route',
    RECEIVED: 'Reçu',
    CANCELLED: 'Annulé',
};

export async function listTransfers(status?: TransferStatus): Promise<StockTransfer[]> {
    const response = await api.get('/api/admin/stock-transfers', { params: { status } });
    return unwrapRaw<StockTransfer[]>(response);
}

/** Les ingrédients ne se transfèrent pas (stock central) : seules des lignes de produits sont acceptées. */
export async function createTransfer(payload: {
    /** Fournisseur : la succursale à approvisionner (par son id, même sans lieu de stock encore). Ignoré pour un compte de succursale. */
    toBranchId?: number;
    toLocationId?: number;
    note?: string;
    lines: { productId: number; qty: number }[];
}): Promise<StockTransfer> {
    const response = await api.post('/api/admin/stock-transfers', payload);
    return unwrapRaw<StockTransfer>(response);
}

export async function approveTransfer(id: number): Promise<StockTransfer> {
    return unwrapRaw<StockTransfer>(await api.post(`/api/admin/stock-transfers/${id}/approve`));
}

/** `lines` : ce qui part réellement par ligne (défaut = la quantité demandée). */
export async function shipTransfer(id: number, lines?: { lineId: number; qty: number }[]): Promise<StockTransfer> {
    return unwrapRaw<StockTransfer>(await api.post(`/api/admin/stock-transfers/${id}/ship`, lines ? { lines } : {}));
}

/** `lines` : ce que la succursale a réellement compté par ligne (défaut = ce qui a été expédié). */
export async function receiveTransfer(id: number, lines?: { lineId: number; qty: number }[]): Promise<StockTransfer> {
    return unwrapRaw<StockTransfer>(await api.post(`/api/admin/stock-transfers/${id}/receive`, lines ? { lines } : {}));
}

export async function cancelTransfer(id: number, reason?: string): Promise<StockTransfer> {
    return unwrapRaw<StockTransfer>(await api.post(`/api/admin/stock-transfers/${id}/cancel`, { reason }));
}
