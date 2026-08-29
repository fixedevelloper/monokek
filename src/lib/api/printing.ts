import api from '../axios';
import { unwrapRaw } from './http';
import { CreatePrinterRequestDto, PrintQueueDto, PrinterDto, UpdatePrinterRequestDto } from './types/printing';
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
        os_printer_name: dto.osPrinterName ?? '',
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
        osPrinterName: data.os_printer_name || undefined,
    };
}

/** `branchId` scopes the list to one branch — omitted, an unscoped admin gets every branch's
 * printers, which is never what a "is there a printer here" check wants. */
export async function listPrinters(branchId?: string | number): Promise<Printer[]> {
    const response = await api.get('/api/admin/settings/printers', { params: branchId ? { branchId } : undefined });
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

/** Real ESC/POS test ticket over the network — server-side only, see PrinterController.testConnection (network printers only). */
export async function testNetworkPrinter(id: Printer['id']): Promise<{ status: string; message: string }> {
    const response = await api.get(`/api/admin/settings/printers/${id}/test`);
    return unwrapRaw(response);
}

/** Catch-up fetch for USB jobs queued while this branch's Tauri app was offline — real-time delivery otherwise happens over SSE ("print-job-queued"). */
export async function getPendingPrintJobs(branchId: string | number): Promise<PrintQueueDto[]> {
    const response = await api.get('/api/print-queue/pending', { params: { branchId } });
    return unwrapRaw(response);
}

export async function markPrintJobSuccess(jobId: PrintQueueDto['id']): Promise<void> {
    await api.post(`/api/print-queue/${jobId}/mark-success`);
}

export async function markPrintJobFailed(jobId: PrintQueueDto['id']): Promise<void> {
    await api.post(`/api/print-queue/${jobId}/mark-failed`);
}
