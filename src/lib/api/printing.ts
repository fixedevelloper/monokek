import api from '../axios';
import { unwrapRaw } from './http';
import { CreatePrinterRequestDto, PrinterDto, UpdatePrinterRequestDto } from './types/printing';
import { Printer, PrinterFormValues } from '@/src/types/menus';

export function mapPrinterDtoToPrinter(dto: PrinterDto): Printer {
    return {
        id: dto.id,
        branch_id: dto.branchId,
        name: dto.name,
        type: dto.type,
        connection: dto.connection,
        ip: dto.ip ?? '',
        port: dto.port,
        location: dto.location,
        paper_width: String(dto.paperWidth),
        char_per_line: dto.charPerLine,
        use_beep: dto.useBeep,
        status: dto.active ? 'online' : 'offline',
    };
}

function mapFormValuesToCreateRequest(data: PrinterFormValues): CreatePrinterRequestDto {
    return {
        branchId: data.branch_id,
        name: data.name,
        type: data.type,
        connection: data.connection,
        ip: data.ip || undefined,
        port: data.port,
        charPerLine: data.char_per_line,
        useBeep: data.use_beep,
        paperWidth: Number(data.paper_width),
        location: data.location,
    };
}

export async function listPrinters(): Promise<Printer[]> {
    const response = await api.get('/api/admin/settings/printers');
    return unwrapRaw<PrinterDto[]>(response).map(mapPrinterDtoToPrinter);
}

export async function createPrinter(data: PrinterFormValues): Promise<Printer> {
    const response = await api.post('/api/admin/settings/printers', mapFormValuesToCreateRequest(data));
    return mapPrinterDtoToPrinter(unwrapRaw(response));
}

export async function updatePrinter(id: Printer['id'], data: PrinterFormValues): Promise<Printer> {
    const payload: UpdatePrinterRequestDto = mapFormValuesToCreateRequest(data);
    const response = await api.put(`/api/admin/settings/printers/${id}`, payload);
    return mapPrinterDtoToPrinter(unwrapRaw(response));
}
