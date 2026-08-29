/** Mirrors com.monokek.reporting.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface StockMovementRowDto {
    occurredAt: string;
    subjectType: 'ingredient' | 'product';
    subjectName: string;
    type: 'in' | 'out' | 'adjust';
    qty: number;
    reason: string | null;
    authorName: string;
    purchase: boolean;
}

export interface StockMovementPageDto {
    content: StockMovementRowDto[];
    totalElements: number;
}
