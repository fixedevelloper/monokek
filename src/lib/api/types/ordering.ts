/** Mirrors com.monokek.ordering.web.dto.* — field names match the Spring records exactly (camelCase). */

export interface AmountsDto {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    formattedTotal: string;
}

export interface TableRefDto {
    id: number;
    name: string;
    status: string;
}

export interface PersonRefDto {
    id: number;
    name: string;
}

export interface OrderModifierDto {
    id: number;
    modifierItemId: number;
    quantity: number;
    name: string;
    price: number;
}

export interface OrderItemDto {
    id: number;
    qty: number;
    price: number;
    total: number;
    status: string;
    product: PersonRefDto;
    variant: PersonRefDto | null;
    modifiers: OrderModifierDto[];
    formattedTotal: string;
}

export interface OrderRoundDto {
    id: number;
    roundNumber: number;
    status: string;
    note: string | null;
    sentAt: string | null;
    items: OrderItemDto[];
    totalRound: number;
}

export interface OrderDto {
    id: number;
    uuid: string;
    reference: string;
    type: string;
    status: string;
    amounts: AmountsDto;
    table: TableRefDto | null;
    waiter: PersonRefDto | null;
    cashier: PersonRefDto | null;
    rounds: OrderRoundDto[];
    note: string | null;
    time: string;
    date: string;
}

export interface ModifierLineDto {
    modifierItemId: number;
    quantity?: number;
}

export interface SendRoundItemLineDto {
    productId: number;
    qty: number;
    modifiers?: ModifierLineDto[];
}

export interface SendRoundRequestDto {
    orderId?: number | null;
    tableId: number;
    items: SendRoundItemLineDto[];
    note?: string;
}

export interface SendRoundResultDto {
    order: OrderDto;
    skippedKitchenItems: { orderItemId: number; productId: number; productName: string; reason: string }[];
}

export interface FinalizePaymentRequestDto {
    paymentMethod: string;
    amountReceived: number;
}

export interface AddItemToRoundRequestDto {
    productId: number;
    qty: number;
    modifiers?: ModifierLineDto[];
}

export interface UpdateRoundItemQtyRequestDto {
    qty: number;
}

export interface TransferTableRequestDto {
    fromTableId: number;
    toTableId: number;
}

export interface ReservationCustomerRefDto {
    id: number;
    name: string;
    phone: string;
}

export interface ReservationDto {
    id: number;
    pickupDate: string;
    guestsCount: number;
    managerNotes: string | null;
    reservationStatus: string;
    customer: ReservationCustomerRefDto | null;
    order: OrderDto | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReservationItemLineDto {
    productId: number;
    quantity: number;
}

export interface CreateReservationRequestDto {
    customerName: string;
    customerPhone: string;
    pickupDate: string;
    guestsCount?: number;
    managerNotes?: string;
    items: ReservationItemLineDto[];
}

export interface UpdateReservationRequestDto {
    customerName: string;
    customerPhone: string;
    pickupDate: string;
    guestsCount?: number;
    managerNotes?: string;
    items: ReservationItemLineDto[];
}

export interface CommissionDto {
    id: number;
    amount: number;
    percentage: number | null;
    type: string;
    status: string;
    createdAt: string;
    waiterId: number;
    waiterName: string;
    orderReference: string;
    productName: string;
    isIncentive: boolean;
    statusLabel: string;
}

export interface CommissionStatsDto {
    totalPending: number;
    totalPaid: number;
    topWaiterId: number | null;
    topWaiterName: string | null;
}
