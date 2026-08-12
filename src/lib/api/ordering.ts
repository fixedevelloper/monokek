import api from '../axios';
import { unwrap, unwrapPage, unwrapRaw, unwrapRawPage } from './http';
import {
    CommissionDto,
    CommissionStatsDto,
    CreateReservationRequestDto,
    OrderDto,
    OrderItemDto,
    OrderRoundDto,
    ReservationDto,
    SendRoundRequestDto,
    SendRoundResultDto,
    UpdateReservationRequestDto,
} from './types/ordering';
import { Commission, Order, OrderItem, OrderItemModifier, Reservation, Round } from '@/src/types/menus';

function mapItemDtoToItem(dto: OrderItemDto): OrderItem {
    return {
        id: dto.id,
        product: dto.product,
        variant: dto.variant,
        qty: dto.qty,
        price: dto.price,
        total: dto.total,
        status: dto.status as OrderItem['status'],
        modifiers: dto.modifiers.map((m): OrderItemModifier => ({ id: m.id, name: m.name, price: m.price, quantity: m.quantity })),
        formatted_total: dto.formattedTotal,
    };
}

function mapRoundDtoToRound(dto: OrderRoundDto): Round {
    return {
        id: dto.id,
        round_number: dto.roundNumber,
        status: dto.status,
        note: dto.note,
        sent_at: dto.sentAt,
        items: dto.items.map(mapItemDtoToItem),
        total_round: dto.totalRound,
    };
}

export function mapOrderDtoToOrder(dto: OrderDto): Order {
    return {
        id: dto.id,
        uuid: dto.uuid,
        reference: dto.reference,
        type: dto.type as Order['type'],
        status: dto.status as Order['status'],
        amounts: {
            subtotal: dto.amounts.subtotal,
            tax: dto.amounts.tax,
            discount: dto.amounts.discount,
            total: dto.amounts.total,
            formatted_total: dto.amounts.formattedTotal,
        },
        rounds: dto.rounds.map(mapRoundDtoToRound),
        table: dto.table ? { id: dto.table.id, name: dto.table.name, status: dto.table.status } : undefined,
        waiter: dto.waiter ?? undefined,
        cashier: dto.cashier ?? undefined,
        note: dto.note,
        created_at: dto.time,
        date: dto.date,
    };
}

function mapReservationDtoToReservation(dto: ReservationDto): Reservation {
    const order = dto.order ? mapOrderDtoToOrder(dto.order) : null;
    return {
        id: dto.id,
        pickup_date: dto.pickupDate,
        guests_count: dto.guestsCount,
        manager_notes: dto.managerNotes,
        reservation_status: dto.reservationStatus,
        customer: dto.customer,
        order: order ? { ...order, items: order.rounds?.flatMap((r) => r.items ?? []) ?? [] } : null,
        created_at: dto.createdAt,
        updated_at: dto.updatedAt,
    };
}

function mapCommissionDtoToCommission(dto: CommissionDto): Commission {
    return {
        id: dto.id,
        amount: dto.amount,
        percentage: dto.percentage,
        type: dto.type,
        status: dto.status,
        created_at: dto.createdAt,
        waiter_id: dto.waiterId,
        waiter_name: dto.waiterName,
        order_reference: dto.orderReference,
        product_name: dto.productName,
        is_incentive: dto.isIncentive,
        status_label: dto.statusLabel,
    };
}

export async function sendRound(payload: SendRoundRequestDto): Promise<{ order: Order; skippedKitchenItems: SendRoundResultDto['skippedKitchenItems'] }> {
    const response = await api.post('/api/pos/orders/send-round', payload);
    const result = unwrapRaw<SendRoundResultDto>(response);
    return { order: mapOrderDtoToOrder(result.order), skippedKitchenItems: result.skippedKitchenItems };
}

export async function finalizePayment(uuid: string, paymentMethod: string, amountReceived: number): Promise<string | null> {
    const response = await api.post(`/api/pos/orders/${uuid}/finalize`, { paymentMethod, amountReceived });
    unwrap<null>(response);
    return response.data.message;
}

export async function listOrdersPos(params: { search?: string; date?: string; status?: string }): Promise<Order[]> {
    const response = await api.get('/api/pos/orders', { params });
    return unwrapRawPage<OrderDto>(response).map(mapOrderDtoToOrder);
}

export async function historyPos(): Promise<Order[]> {
    const response = await api.get('/api/pos/orders/history');
    return unwrap<OrderDto[]>(response).map(mapOrderDtoToOrder);
}

export async function historyAdmin(params: { search?: string; status?: string; startDate?: string; endDate?: string }): Promise<Order[]> {
    const response = await api.get('/api/admin/orders/history', { params });
    return unwrapPage<OrderDto>(response).map(mapOrderDtoToOrder);
}

export async function waiterOrders(params: { date?: string; status?: string }): Promise<Order[]> {
    const response = await api.get('/api/pos/waiter/orders', { params });
    return unwrapRaw<OrderDto[]>(response).map(mapOrderDtoToOrder);
}

export async function getActiveOrder(tableId: number | string): Promise<Order | null> {
    const response = await api.get(`/api/pos/tables/${tableId}/active-order`);
    const dto = unwrap<OrderDto | null>(response);
    return dto ? mapOrderDtoToOrder(dto) : null;
}

export async function markAsServed(orderId: number): Promise<void> {
    await api.post(`/api/pos/orders/${orderId}/serve`);
}

export async function updateRoundItemQty(roundId: number, itemId: number, qty: number): Promise<Order> {
    const response = await api.patch(`/api/pos/rounds/${roundId}/items/${itemId}`, { qty });
    return mapOrderDtoToOrder(unwrapRaw(response));
}

export async function addItemToRound(roundId: number, productId: number, qty: number, modifiers?: { modifierItemId: number; quantity?: number }[]): Promise<Order> {
    const response = await api.post(`/api/pos/rounds/${roundId}/items`, { productId, qty, modifiers });
    return mapOrderDtoToOrder(unwrapRaw(response));
}

export async function transferTable(fromTableId: number, toTableId: number): Promise<void> {
    await api.post('/api/pos/tables/transfer', { fromTableId, toTableId });
}

export async function listReservations(filter?: string): Promise<Reservation[]> {
    const response = await api.get('/api/admin/reservations', { params: { filter } });
    return unwrapRawPage<ReservationDto>(response).map(mapReservationDtoToReservation);
}

export async function createReservation(payload: CreateReservationRequestDto): Promise<Reservation> {
    const response = await api.post('/api/admin/reservations', payload);
    return mapReservationDtoToReservation(unwrap(response));
}

export async function updateReservation(id: number, payload: UpdateReservationRequestDto): Promise<Reservation> {
    const response = await api.put(`/api/admin/reservations/${id}`, payload);
    return mapReservationDtoToReservation(unwrap(response));
}

export async function deleteReservation(id: number): Promise<void> {
    await api.delete(`/api/admin/reservations/${id}`);
}

export async function payReservation(orderId: number): Promise<void> {
    await api.post(`/api/admin/reservations/${orderId}/pay`);
}

export async function listCommissions(month?: number, year?: number): Promise<Commission[]> {
    const response = await api.get('/api/admin/commissions', { params: { month, year } });
    return unwrapRaw<CommissionDto[]>(response).map(mapCommissionDtoToCommission);
}

export async function commissionStats(): Promise<{ totalPending: number; totalPaid: number; topWaiterId: number | null; topWaiterName: string | null }> {
    const response = await api.get('/api/admin/commissions/stats');
    return unwrapRaw<CommissionStatsDto>(response);
}

export async function settleCommissions(waiterId: number): Promise<string> {
    const response = await api.post(`/api/admin/commissions/settle/${waiterId}`);
    return unwrapRaw<{ message: string }>(response).message;
}
