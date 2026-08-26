import api from '../axios';
import { unwrapRaw } from './http';
import {
    CouponDto,
    CouponValidationResult,
    CreateCouponRequest,
    CreateCustomerRequest,
    CustomerDto,
    LoyaltyPointsRequest,
    LoyaltyTransactionDto,
    UpdateCustomerRequest,
} from './types/crm';

export async function listCustomers(search?: string): Promise<CustomerDto[]> {
    const response = await api.get('/api/admin/customers', { params: search ? { search } : undefined });
    return unwrapRaw(response);
}

export async function createCustomer(payload: CreateCustomerRequest): Promise<CustomerDto> {
    const response = await api.post('/api/admin/customers', payload);
    return unwrapRaw(response);
}

export async function updateCustomer(id: number, payload: UpdateCustomerRequest): Promise<CustomerDto> {
    const response = await api.put(`/api/admin/customers/${id}`, payload);
    return unwrapRaw(response);
}

export async function deleteCustomer(id: number): Promise<void> {
    await api.delete(`/api/admin/customers/${id}`);
}

export async function listCoupons(): Promise<CouponDto[]> {
    const response = await api.get('/api/admin/coupons');
    return unwrapRaw(response);
}

export async function createCoupon(payload: CreateCouponRequest): Promise<CouponDto> {
    const response = await api.post('/api/admin/coupons', payload);
    return unwrapRaw(response);
}

export async function validateCoupon(code: string): Promise<CouponValidationResult> {
    const response = await api.get('/api/admin/coupons/validate', { params: { code } });
    return unwrapRaw(response);
}

/** branchId picks which POS terminal's receipt printer prints the ticket — a coupon has no branch of its own. */
export async function printCoupon(id: number, branchId: string | number): Promise<void> {
    await api.post(`/api/admin/coupons/${id}/print`, null, { params: { branchId } });
}

export async function listLoyaltyTransactions(customerId: number): Promise<LoyaltyTransactionDto[]> {
    const response = await api.get(`/api/admin/customers/${customerId}/loyalty`);
    return unwrapRaw(response);
}

export async function earnPoints(customerId: number, payload: LoyaltyPointsRequest): Promise<{ points: number }> {
    const response = await api.post(`/api/admin/customers/${customerId}/loyalty/earn`, payload);
    return unwrapRaw(response);
}

export async function redeemPoints(customerId: number, payload: LoyaltyPointsRequest): Promise<{ points: number }> {
    const response = await api.post(`/api/admin/customers/${customerId}/loyalty/redeem`, payload);
    return unwrapRaw(response);
}
