import api from '../axios';
import { unwrap } from './http';
import {
    LoginResponseDto,
    PermissionOptionDto,
    RoleOptionDto,
    StaffCreateRequestDto,
    StaffDto,
    StaffUpdateRequestDto,
    UserSummaryDto,
} from './types/identity';
import { Permission, ROLE_CONFIG, StaffMember } from '@/src/types/management';

/**
 * L'annuaire /admin/staff est partagé avec le PMS hôtelier (même monokek-identity,
 * voir permissionService.ts côté pms-frontend : "même annuaire pour le POS et le
 * PMS"). Les rôles hôtel (receptionist, housekeeper — V12__add_hotel_roles.sql)
 * n'existent même pas dans StaffRole/ROLE_CONFIG ici : sans ce filtre ils
 * s'affichaient déjà cassés (ROLE_CONFIG[role] undefined) en plus d'être hors
 * sujet dans une app restaurant.
 */
const RESTAURANT_ROLES = new Set<string>(Object.keys(ROLE_CONFIG));

export function mapStaffDtoToMember(dto: StaffDto): StaffMember {
    return {
        id: dto.id,
        uuid: dto.uuid,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        is_active: dto.isActive,
        role: (dto.role as StaffMember['role']) ?? 'waiter',
        permissions: dto.permissions,
        created_at: dto.createdAt ?? '',
        updated_at: dto.updatedAt ?? '',
        branch_id: dto.branchId,
    };
}

export async function login(email: string, password: string, deviceName: string): Promise<LoginResponseDto> {
    const response = await api.post('/api/login', { email, password, deviceName });
    return unwrap(response);
}

/**
 * `token` is optional and meant for the moment right after `login()`: the
 * Zustand auth store (which the axios interceptor reads for every other
 * call) hasn't been written yet at that point, so this lets the caller
 * attach the freshly issued token explicitly instead of racing the store.
 */
export async function me(token?: string): Promise<StaffDto> {
    const response = await api.get('/api/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return response.data;
}

export async function verifyPin(pin: string): Promise<UserSummaryDto> {
    const response = await api.post('/api/auth/verify-pin', { pin });
    return unwrap(response);
}

export async function updatePin(pin: string): Promise<void> {
    await api.post('/api/auth/update-pin', { pin });
}

/** Identifies which colleague in `branchId` owns `pin` — for self-service clock-in/out on a shared POS terminal. */
export async function lookupPin(branchId: string | number, pin: string): Promise<UserSummaryDto> {
    const response = await api.post('/api/auth/lookup-pin', { branchId, pin });
    return unwrap(response);
}

/** Admin-side PIN onboarding — sets another employee's PIN (they've never logged in to self-set one via updatePin). */
export async function setStaffPin(uuid: string, pin: string): Promise<void> {
    await api.put(`/api/admin/staff/${uuid}/pin`, { pin });
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    // Spring requires newPasswordConfirmation; the current UI has no confirm field, so auto-confirm
    // (same pattern the staff-creation form already uses for its own password_confirmation).
    await api.post('/api/auth/update-password', {
        oldPassword,
        newPassword,
        newPasswordConfirmation: newPassword,
    });
}

export async function logout(): Promise<void> {
    await api.post('/api/logout');
}

export async function listStaff(): Promise<StaffMember[]> {
    const response = await api.get('/api/admin/staff');
    return unwrap<StaffDto[]>(response)
        .map(mapStaffDtoToMember)
        .filter((member) => RESTAURANT_ROLES.has(member.role));
}

export async function createStaff(payload: StaffCreateRequestDto): Promise<StaffMember> {
    const response = await api.post('/api/admin/staff', payload);
    return mapStaffDtoToMember(unwrap(response));
}

export async function updateStaff(uuid: string, payload: StaffUpdateRequestDto): Promise<StaffMember> {
    const response = await api.put(`/api/admin/staff/${uuid}`, payload);
    return mapStaffDtoToMember(unwrap(response));
}

export async function deleteStaff(uuid: string): Promise<void> {
    await api.delete(`/api/admin/staff/${uuid}`);
}

export async function listRoles(): Promise<RoleOptionDto[]> {
    const response = await api.get('/api/admin/staff/roles');
    // Même filtre restaurant que listStaff — sinon on peut créer un compte
    // "receptionist"/"housekeeper" depuis cette app, qui disparaîtrait aussitôt
    // de la liste du personnel.
    return unwrap<RoleOptionDto[]>(response).filter((role) => RESTAURANT_ROLES.has(role.name));
}

export async function listPermissions(): Promise<Permission[]> {
    const response = await api.get('/api/admin/staff/permissions/list');
    return unwrap<PermissionOptionDto[]>(response);
}

export async function updateStaffPermissions(uuid: string, permissions: string[]): Promise<number> {
    const response = await api.put(`/api/admin/staff/${uuid}/permissions`, { permissions });
    return unwrap(response);
}
