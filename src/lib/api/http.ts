import { AxiosResponse } from 'axios';

/**
 * Envelope every monokek-spring controller responds with:
 * {status: "success"|"error", message, data, errors}
 */
export interface ApiEnvelope<T> {
    status: 'success' | 'error';
    message: string | null;
    data: T;
    errors: unknown;
}

/** Spring Data's default pagination shape (java.org.springframework.data.domain.Page). */
export interface SpringPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    last: boolean;
}

export class ApiError extends Error {
    errors: unknown;

    constructor(message: string, errors?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.errors = errors;
    }
}

/** Unwraps {status, message, data, errors}, throwing ApiError when status === "error". */
export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
    const envelope = response.data;
    if (envelope.status === 'error') {
        throw new ApiError(envelope.message ?? 'Une erreur est survenue', envelope.errors);
    }
    return envelope.data;
}

/**
 * Some endpoints return the DTO directly (no envelope) or a Spring Page<T>
 * without going through ApiResponse. Use for plain, un-enveloped responses.
 */
export function unwrapRaw<T>(response: AxiosResponse<T>): T {
    return response.data;
}

/** Unwraps an enveloped Spring Page<T>, discarding pagination metadata (no pagination UI exists today). */
export function unwrapPage<T>(response: AxiosResponse<ApiEnvelope<SpringPage<T>>>): T[] {
    return unwrap(response).content;
}

/** Unwraps a bare (non-enveloped) Spring Page<T> response. */
export function unwrapRawPage<T>(response: AxiosResponse<SpringPage<T>>): T[] {
    return response.data.content;
}
