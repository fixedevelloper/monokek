/** Mirrors com.monokek.crm.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface CustomerDto {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    points: number;
}

export interface CreateCustomerRequest {
    name: string;
    phone: string;
    email?: string;
}

export interface UpdateCustomerRequest {
    name?: string;
    phone?: string;
    email?: string;
}

export interface CouponDto {
    id: number;
    code: string;
    amount: number;
    minAmount: number | null;
    expiresAt: string | null;
    maxUses: number | null;
    timesUsed: number;
    expired: boolean;
}

export interface CreateCouponRequest {
    code: string;
    amount: number;
    minAmount?: number;
    expiresAt?: string;
    maxUses?: number;
}

export interface CouponValidationResult {
    valid: boolean;
    amount: number | null;
    message: string | null;
}

export interface LoyaltyTransactionDto {
    id: number;
    points: number;
    type: string;
    createdAt: string;
}

export interface LoyaltyPointsRequest {
    points: number;
}
