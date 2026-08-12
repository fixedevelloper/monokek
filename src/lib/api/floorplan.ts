import api from '../axios';
import { unwrapRaw } from './http';
import {
    CreateFloorRequestDto,
    CreateTableRequestDto,
    FloorDto,
    TableDto,
    UpdateFloorRequestDto,
    UpdateTableRequestDto,
} from './types/floorplan';
import { Floor, Table } from '@/src/types/tables';

export function mapTableDtoToTable(dto: TableDto): Table {
    return {
        id: dto.id,
        name: dto.name,
        status: dto.status,
        seats: dto.seats,
        virtual: dto.virtual,
        // total/time n'existent plus sur TableDto — voir ordering.getActiveOrder pour la conso en cours.
    };
}

export function mapFloorDtoToFloor(dto: FloorDto): Floor {
    return {
        id: dto.id,
        name: dto.name,
        tables: dto.tables.map(mapTableDtoToTable),
    };
}

export async function listFloors(): Promise<Floor[]> {
    const response = await api.get('/api/pos/floors');
    return unwrapRaw<FloorDto[]>(response).map(mapFloorDtoToFloor);
}

export async function createFloor(payload: CreateFloorRequestDto): Promise<Floor> {
    const response = await api.post('/api/pos/floors', payload);
    return mapFloorDtoToFloor(unwrapRaw(response));
}

export async function updateFloor(id: number, payload: UpdateFloorRequestDto): Promise<Floor> {
    const response = await api.put(`/api/pos/floors/${id}`, payload);
    return mapFloorDtoToFloor(unwrapRaw(response));
}

export async function deleteFloor(id: number): Promise<void> {
    await api.delete(`/api/pos/floors/${id}`);
}

export async function listTablesPos(): Promise<Table[]> {
    const response = await api.get('/api/pos/tables');
    return unwrapRaw<TableDto[]>(response).map(mapTableDtoToTable);
}

export async function updateTableStatus(id: number, status: string): Promise<Table> {
    const response = await api.patch(`/api/pos/tables/${id}/status`, { status });
    return mapTableDtoToTable(unwrapRaw(response));
}

export async function listTablesAdmin(floorId?: number): Promise<Table[]> {
    const response = await api.get('/api/admin/tables', { params: { floorId } });
    return unwrapRaw<TableDto[]>(response).map(mapTableDtoToTable);
}

export async function createTable(payload: CreateTableRequestDto): Promise<Table> {
    const response = await api.post('/api/admin/tables', payload);
    return mapTableDtoToTable(unwrapRaw(response));
}

export async function updateTable(id: number, payload: UpdateTableRequestDto): Promise<Table> {
    const response = await api.put(`/api/admin/tables/${id}`, payload);
    return mapTableDtoToTable(unwrapRaw(response));
}

export async function deleteTable(id: number): Promise<void> {
    await api.delete(`/api/admin/tables/${id}`);
}
