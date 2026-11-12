import api from '../axios';
import { unwrapRaw } from './http';

/** "branchId est servie par la cuisine de hubBranchId" — voir kitchen_hub_links côté serveur. */
export interface KitchenHubLink {
    id: number;
    branchId: number;
    hubBranchId: number;
    /** Imprimer aussi le ticket cuisine à la succursale d'origine (en plus du hub). */
    printOriginCopy: boolean;
}

// Réservé à un ADMIN sans succursale assignée (le serveur répond 403 sinon).

export async function listHubLinks(): Promise<KitchenHubLink[]> {
    const response = await api.get('/api/admin/kitchen-hub-links');
    return unwrapRaw<KitchenHubLink[]>(response);
}

export async function createHubLink(payload: { branchId: number; hubBranchId: number; printOriginCopy: boolean }): Promise<KitchenHubLink> {
    const response = await api.post('/api/admin/kitchen-hub-links', payload);
    return unwrapRaw<KitchenHubLink>(response);
}

export async function setHubLinkOriginCopy(id: number, printOriginCopy: boolean): Promise<KitchenHubLink> {
    const response = await api.patch(`/api/admin/kitchen-hub-links/${id}`, { printOriginCopy });
    return unwrapRaw<KitchenHubLink>(response);
}

export async function deleteHubLink(id: number): Promise<void> {
    await api.delete(`/api/admin/kitchen-hub-links/${id}`);
}
