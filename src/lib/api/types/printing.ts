/** Mirrors com.monokek.printing.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface PrinterDto {
    id: number;
    branchId: number;
    name: string;
    type: string;
    connection: string;
    location: string;
    ip: string | null;
    port: number;
    charPerLine: number;
    active: boolean;
    paperWidth: number;
    useBeep: boolean;
}

export interface CreatePrinterRequestDto {
    branchId: number;
    name: string;
    type: string;
    connection: string;
    ip?: string;
    port?: number;
    charPerLine?: number;
    useBeep?: boolean;
    paperWidth?: number;
    location: string;
}

export interface UpdatePrinterRequestDto {
    branchId?: number;
    name?: string;
    type?: string;
    connection?: string;
    ip?: string;
    port?: number;
    charPerLine?: number;
    isActive?: boolean;
    useBeep?: boolean;
    paperWidth?: number;
    location?: string;
}
