import api from '../axios';
import { unwrapRaw } from './http';
import { KitchenStation, StationType } from '@/src/types/kitchenStation';

/** Read-only, kitchen/pos-facing list — includes each station's pending-ticket count. Any authenticated user. */
export async function listStations(): Promise<KitchenStation[]> {
    const response = await api.get('/api/kitchen/stations');
    return unwrapRaw<KitchenStation[]>(response);
}

/**
 * Stations qu'une catégorie de {@code branchId} peut utiliser : celles de la succursale + celles des cuisines
 * centrales auxquelles elle est liée. Un compte rattaché à une succursale obtient toujours la sienne ;
 * `branchId` ne sert qu'à un admin sans succursale. Le serveur refuse de toute façon toute autre station.
 */
export async function listUsableStations(branchId?: number): Promise<KitchenStation[]> {
    const response = await api.get('/api/kitchen/stations/usable', { params: { branchId } });
    return unwrapRaw<KitchenStation[]>(response);
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export async function listStationsAdmin(branchId?: number): Promise<KitchenStation[]> {
    const response = await api.get('/api/admin/kitchen-stations', { params: { branchId } });
    return unwrapRaw<KitchenStation[]>(response);
}

export async function createStation(payload: { branchId: number; name: string; type: StationType }): Promise<KitchenStation> {
    const response = await api.post('/api/admin/kitchen-stations', payload);
    return unwrapRaw<KitchenStation>(response);
}

export async function updateStation(id: number, payload: Partial<{ name: string; type: StationType }>): Promise<KitchenStation> {
    const response = await api.put(`/api/admin/kitchen-stations/${id}`, payload);
    return unwrapRaw<KitchenStation>(response);
}

export async function deleteStation(id: number): Promise<void> {
    await api.delete(`/api/admin/kitchen-stations/${id}`);
}
