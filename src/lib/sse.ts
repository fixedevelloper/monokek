
import api from "./axios";

export interface SseTicket {
    ticket: string;
    baseUrl: string;
}

/**
 * Fetches a short-lived, single-use SSE ticket via the shared axios instance —
 * reuses its existing backend-IP resolution and JWT `Authorization` header,
 * since native `EventSource` can't send custom headers itself.
 */
export async function requestSseTicket(branchId: string | number): Promise<SseTicket> {
    const response = await api.post("/api/sse/ticket", null, { params: { branchId } });
    const baseUrl = (response.config.baseURL ?? "").replace(/\/+$/, "");
    return { ticket: response.data.ticket, baseUrl };
}
