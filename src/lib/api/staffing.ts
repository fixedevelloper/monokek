import api from '../axios';
import { unwrapRaw } from './http';
import { CreateShiftRequestDto, ShiftDto, TimeClockEntryDto, UpdateShiftRequestDto } from './types/staffing';

export async function listShifts(branchId: string | number | undefined, from: string, to: string): Promise<ShiftDto[]> {
    const response = await api.get('/api/staffing/shifts', { params: { branchId, from, to } });
    return unwrapRaw(response);
}

export async function myShifts(from: string, to: string): Promise<ShiftDto[]> {
    const response = await api.get('/api/staffing/shifts/mine', { params: { from, to } });
    return unwrapRaw(response);
}

export async function createShift(payload: CreateShiftRequestDto): Promise<ShiftDto> {
    const response = await api.post('/api/staffing/shifts', payload);
    return unwrapRaw(response);
}

export async function updateShift(id: number, payload: UpdateShiftRequestDto): Promise<ShiftDto> {
    const response = await api.put(`/api/staffing/shifts/${id}`, payload);
    return unwrapRaw(response);
}

export async function deleteShift(id: number): Promise<void> {
    await api.delete(`/api/staffing/shifts/${id}`);
}

export async function clockIn(userId: number, branchId: string | number): Promise<TimeClockEntryDto> {
    const response = await api.post('/api/staffing/clock/clock-in', { userId, branchId });
    return unwrapRaw(response);
}

export async function clockOut(userId: number): Promise<TimeClockEntryDto> {
    const response = await api.post('/api/staffing/clock/clock-out', { userId });
    return unwrapRaw(response);
}

export async function currentlyPresent(branchId: string | number): Promise<TimeClockEntryDto[]> {
    const response = await api.get('/api/staffing/clock/current', { params: { branchId } });
    return unwrapRaw(response);
}

export async function clockHistory(params: { userId?: number; branchId?: number; from: string; to: string }): Promise<TimeClockEntryDto[]> {
    const response = await api.get('/api/staffing/clock/history', { params });
    return unwrapRaw(response);
}
