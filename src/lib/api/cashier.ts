import api from '../axios';
import { unwrapRaw } from './http';
import {
    CashRegisterDto,
    CashSessionDto,
    CashStatusDto,
    CashSummaryDto,
    CloseReportDto,
    OpenSessionRequestDto,
    PaymentBreakdownDto,
    StoreRegisterRequestDto,
    UpdateRegisterRequestDto,
} from './types/cashier';
import { CashRegister, CashSession, CashStatus, CashSummary, CloseReport, PaymentBreakdown } from '@/src/types/cashier';

function mapSessionDtoToSession(dto: CashSessionDto): CashSession {
    return {
        id: dto.id,
        register_id: dto.registerId,
        register_name: dto.registerName,
        opening_amount: dto.openingAmount,
        closing_amount: dto.closingAmount,
        opened_at: dto.openedAt,
        closed_at: dto.closedAt,
        expected_amount: dto.expectedAmount,
        note: dto.note,
    };
}

function mapBreakdown(dto: PaymentBreakdownDto): PaymentBreakdown {
    return { name: dto.method, total: dto.total };
}

function mapRegisterDtoToRegister(dto: CashRegisterDto): CashRegister {
    return { id: dto.id, name: dto.name, branch_id: dto.branchId, is_open: dto.isOpen, opened_by_user_name: dto.openedByUserName };
}

export async function listRegisters(): Promise<CashRegister[]> {
    const response = await api.get('/api/cash/registers');
    return unwrapRaw<CashRegisterDto[]>(response).map(mapRegisterDtoToRegister);
}

export async function storeRegister(payload: StoreRegisterRequestDto): Promise<CashRegister> {
    const response = await api.post('/api/cash/registers', payload);
    return mapRegisterDtoToRegister(unwrapRaw(response));
}

export async function updateRegister(id: number, payload: UpdateRegisterRequestDto): Promise<CashRegister> {
    const response = await api.put(`/api/cash/registers/${id}`, payload);
    return mapRegisterDtoToRegister(unwrapRaw(response));
}

export async function deleteRegister(id: number): Promise<void> {
    await api.delete(`/api/cash/registers/${id}`);
}

export async function status(): Promise<CashStatus> {
    const response = await api.get('/api/cash/status');
    const dto = unwrapRaw<CashStatusDto>(response);
    return { is_open: dto.isOpen, session: dto.session ? mapSessionDtoToSession(dto.session) : null };
}

export async function open(registerId: number, openingAmount: number): Promise<CashSession> {
    const response = await api.post('/api/cash/open', { registerId, openingAmount } satisfies OpenSessionRequestDto);
    return mapSessionDtoToSession(unwrapRaw(response));
}

export async function currentSummary(): Promise<CashSummary> {
    const response = await api.get('/api/cash/current-summary');
    const dto = unwrapRaw<CashSummaryDto>(response);
    return {
        session: mapSessionDtoToSession(dto.session),
        payments_detail: dto.paymentsDetail.map(mapBreakdown),
        total_sales: dto.totalSales,
    };
}

export async function close(closingAmount: number, note?: string): Promise<CloseReport> {
    const response = await api.post('/api/cash/close', { closingAmount, note });
    const dto = unwrapRaw<CloseReportDto>(response);
    return {
        opened_at: dto.report.openedAt,
        closed_at: dto.report.closedAt,
        opening_amount: dto.report.openingAmount,
        total_payments: dto.report.totalPayments,
        expected_total: dto.report.expectedTotal,
        actual_total: dto.report.actualTotal,
        difference: dto.report.difference,
        note: dto.report.note,
        payments_detail: dto.report.paymentsDetail.map(mapBreakdown),
    };
}
