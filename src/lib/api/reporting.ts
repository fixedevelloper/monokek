import api from '../axios';
import { unwrapRaw } from './http';
import { StockMovementPageDto } from './types/reporting';

export interface StockMovementFilters {
    search?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    /** Scopes the feed to one ingredient/product — used by the "Historique" deep link on its own admin page. */
    ingredientId?: number;
    productId?: number;
    page?: number;
    size?: number;
}

/** Unified ingredient + product stock movement feed — see StockMovementReportController. Pass a
 * large `size` (capped server-side at 5000) to fetch every row matching the current filters at
 * once, e.g. for a PDF export that must reflect exactly what's on screen. */
export async function listStockMovements(filters: StockMovementFilters): Promise<StockMovementPageDto> {
    const response = await api.get('/api/admin/reporting/stock-movements', { params: filters });
    return unwrapRaw(response);
}
