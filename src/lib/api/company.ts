import api from '../axios';
import { unwrapRaw } from './http';
import { Branch, Company, Workstation } from '@/src/types/company';

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export async function listCompanies(): Promise<Company[]> {
    const response = await api.get('/api/admin/companies');
    return unwrapRaw<Company[]>(response);
}

export async function createCompany(payload: { name: string; phone?: string; email?: string }): Promise<Company> {
    const response = await api.post('/api/admin/companies', payload);
    return unwrapRaw<Company>(response);
}

export async function updateCompany(id: number, payload: Partial<{ name: string; phone: string; email: string }>): Promise<Company> {
    const response = await api.put(`/api/admin/companies/${id}`, payload);
    return unwrapRaw<Company>(response);
}

export async function deleteCompany(id: number): Promise<void> {
    await api.delete(`/api/admin/companies/${id}`);
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export async function listBranches(companyId?: number): Promise<Branch[]> {
    const response = await api.get('/api/admin/branches', { params: { companyId } });
    return unwrapRaw<Branch[]>(response);
}

export async function createBranch(payload: { companyId: number; name: string; address?: string; phone?: string }): Promise<Branch> {
    const response = await api.post('/api/admin/branches', payload);
    return unwrapRaw<Branch>(response);
}

export async function updateBranch(id: number, payload: Partial<{ companyId: number; name: string; address: string; phone: string }>): Promise<Branch> {
    const response = await api.put(`/api/admin/branches/${id}`, payload);
    return unwrapRaw<Branch>(response);
}

export async function deleteBranch(id: number): Promise<void> {
    await api.delete(`/api/admin/branches/${id}`);
}

// ---------------------------------------------------------------------------
// Workstations
// ---------------------------------------------------------------------------

export async function listWorkstations(branchId?: number): Promise<Workstation[]> {
    const response = await api.get('/api/admin/workstations', { params: { branchId } });
    return unwrapRaw<Workstation[]>(response);
}

export async function createWorkstation(payload: { branchId: number; name: string; type: string; ip?: string }): Promise<Workstation> {
    const response = await api.post('/api/admin/workstations', payload);
    return unwrapRaw<Workstation>(response);
}

export async function updateWorkstation(id: number, payload: Partial<{ branchId: number; name: string; type: string; ip: string }>): Promise<Workstation> {
    const response = await api.put(`/api/admin/workstations/${id}`, payload);
    return unwrapRaw<Workstation>(response);
}

export async function deleteWorkstation(id: number): Promise<void> {
    await api.delete(`/api/admin/workstations/${id}`);
}
