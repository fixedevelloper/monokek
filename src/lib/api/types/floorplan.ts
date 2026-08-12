/** Mirrors com.monokek.floorplan.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface TableDto {
    id: number;
    floorId: number;
    floorName: string;
    name: string;
    seats: number;
    status: 'free' | 'occupied' | 'billing' | 'maintenance';
    /** True for a branch's always-free fallback table (walk-ins with no real table) — never occupied, never reuses an order. */
    virtual: boolean;
}

export interface FloorDto {
    id: number;
    branchId: number;
    name: string;
    tablesCount: number;
    tables: TableDto[];
}

export interface CreateFloorRequestDto {
    branchId: number;
    name: string;
}

export interface UpdateFloorRequestDto {
    name: string;
}

export interface CreateTableRequestDto {
    floorId: number;
    name: string;
    seats: number;
}

export interface UpdateTableRequestDto {
    floorId?: number;
    name?: string;
    seats?: number;
}

export interface UpdateTableStatusRequestDto {
    status: string;
}
