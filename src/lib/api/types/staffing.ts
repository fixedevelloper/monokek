/** Mirrors com.monokek.staffing.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface ShiftDto {
    id: number;
    userId: number;
    userName: string | null;
    branchId: number;
    startsAt: string;
    endsAt: string;
    note: string | null;
}

export interface CreateShiftRequestDto {
    userId: number;
    branchId?: number;
    startsAt: string;
    endsAt: string;
    note?: string;
}

export interface UpdateShiftRequestDto {
    userId?: number;
    branchId?: number;
    startsAt?: string;
    endsAt?: string;
    note?: string;
}

export interface TimeClockEntryDto {
    id: number;
    userId: number;
    userName: string | null;
    branchId: number;
    shiftId: number | null;
    clockInAt: string;
    clockOutAt: string | null;
    workedMinutes: number;
}
