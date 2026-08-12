/** Mirrors com.monokek.cashier.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface CashRegisterDto {
    id: number;
    branchId: number;
    name: string;
    isOpen: boolean;
    openedByUserName: string | null;
}

export interface CashSessionDto {
    id: number;
    registerId: number;
    registerName: string;
    openingAmount: number;
    closingAmount: number | null;
    openedAt: string;
    closedAt: string | null;
    expectedAmount: number | null;
    note: string | null;
}

export interface CashStatusDto {
    isOpen: boolean;
    session: CashSessionDto | null;
}

export interface PaymentBreakdownDto {
    method: string;
    total: number;
}

export interface CashSummaryDto {
    session: CashSessionDto;
    paymentsDetail: PaymentBreakdownDto[];
    totalSales: number;
}

export interface CloseReportDto {
    message: string;
    report: {
        openedAt: string;
        closedAt: string;
        openingAmount: number;
        totalPayments: number;
        expectedTotal: number;
        actualTotal: number;
        difference: number;
        note: string | null;
        paymentsDetail: PaymentBreakdownDto[];
    };
}

export interface OpenSessionRequestDto {
    registerId: number;
    openingAmount: number;
}

export interface CloseSessionRequestDto {
    closingAmount: number;
    note?: string;
}

export interface StoreRegisterRequestDto {
    name: string;
    branchId: number;
}

export interface UpdateRegisterRequestDto {
    name?: string;
    branchId?: number;
}
