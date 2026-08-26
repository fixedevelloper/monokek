export interface CashRegister {
    id: number;
    name: string;
    branch_id: number;
    is_open: boolean;
    opened_by_user_name: string | null;
}

export interface CashSession {
    id: number;
    register_id: number;
    register_name: string;
    opening_amount: number;
    closing_amount: number | null;
    opened_at: string;
    closed_at: string | null;
    expected_amount: number | null;
    note: string | null;
}

export interface CashSessionAdmin {
    id: number;
    register_id: number;
    register_name: string;
    branch_id: number;
    cashier_user_id: number;
    cashier_name: string | null;
    opening_amount: number;
    closing_amount: number | null;
    expected_amount: number | null;
    opened_at: string;
    closed_at: string | null;
    open: boolean;
}

export interface CashStatus {
    is_open: boolean;
    session: CashSession | null;
}

export interface PaymentBreakdown {
    name: string;
    total: number;
}

export interface CashSummary {
    session: CashSession;
    payments_detail: PaymentBreakdown[];
    total_sales: number;
}

export interface CloseReport {
    opened_at: string;
    closed_at: string;
    opening_amount: number;
    total_payments: number;
    expected_total: number;
    actual_total: number;
    difference: number;
    note: string | null;
    payments_detail: PaymentBreakdown[];
}
