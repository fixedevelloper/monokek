/** Mirrors com.monokek.identity.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface LoginRequestDto {
    email: string;
    password: string;
    deviceName?: string;
}

export interface UserSummaryDto {
    id: number;
    name: string;
    role: string | null;
}

export interface LoginResponseDto {
    user: UserSummaryDto;
    token: string;
}

export interface StaffDto {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    role: string | null;
    roles: string[];
    permissions: string[];
    createdAt: string | null;
    updatedAt: string | null;
    /** Null = no assigned branch (owner/super-admin) — sees every branch's data. */
    branchId: number | null;
}

export interface RoleOptionDto {
    id: number;
    name: string;
}

export interface PermissionOptionDto {
    id: number;
    name: string;
    label: string;
}

export interface StaffCreateRequestDto {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    branchId?: number | null;
}

export interface StaffUpdateRequestDto {
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    role?: string;
    branchId?: number | null;
    clearBranchId?: boolean;
}

export interface UpdatePermissionsRequestDto {
    permissions: string[];
}
