import api from '../axios';
import { unwrapRaw } from './http';
import {
    CreatePurchaseOrderRequest,
    CreateSupplierRequest,
    PurchaseOrderDto,
    SupplierDto,
    UpdateSupplierRequest,
} from './types/suppliers';

export async function listSuppliers(search?: string): Promise<SupplierDto[]> {
    const response = await api.get('/api/admin/suppliers', { params: search ? { search } : undefined });
    return unwrapRaw(response);
}

export async function createSupplier(payload: CreateSupplierRequest): Promise<SupplierDto> {
    const response = await api.post('/api/admin/suppliers', payload);
    return unwrapRaw(response);
}

export async function updateSupplier(id: number, payload: UpdateSupplierRequest): Promise<SupplierDto> {
    const response = await api.put(`/api/admin/suppliers/${id}`, payload);
    return unwrapRaw(response);
}

export async function deleteSupplier(id: number): Promise<void> {
    await api.delete(`/api/admin/suppliers/${id}`);
}

export async function listPurchaseOrders(supplierId: number): Promise<PurchaseOrderDto[]> {
    const response = await api.get(`/api/admin/suppliers/${supplierId}/purchase-orders`);
    return unwrapRaw(response);
}

/** Validates and applies the purchase server-side (stock update + traced movement per line) — see
 * PurchaseOrderService#store. */
export async function createPurchaseOrder(payload: CreatePurchaseOrderRequest): Promise<void> {
    await api.post('/api/admin/purchase-orders', payload);
}
