"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { requestSseTicket } from "../lib/sse";
import { resolveBranchId as resolveBranchIdShared } from "../lib/branch";

/** Payload shapes actually broadcast by the backend for each known SSE event name. */
interface NotificationPayloads {
    'order.created': { orderId?: number; reference?: string };
    'order.updated': { orderId?: number; newStatus?: string };
    'ticket.created': { stationId?: number | string; tableName?: string };
}
type PayloadFor<E extends string> = E extends keyof NotificationPayloads ? NotificationPayloads[E] : unknown;
type Handler<T = unknown> = (payload: T) => void;

interface NotificationsContextType {
    /** Subscribe to a named SSE event (e.g. "order.updated", "ticket.created"). Returns an unsubscribe function. */
    on: <E extends string>(eventName: E, handler: Handler<PayloadFor<E>>) => () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const NO_BRANCH_RETRY_MS = 5000;
const RECONNECT_DELAY_MS = 3000;

/**
 * Single SSE connection for the whole app (replaces the old per-page Echo
 * connections — each page used to open its own). A ticket is single-use, so
 * unlike a plain `new EventSource(url)`, reconnection after a drop needs a
 * *fresh* ticket — handled manually here instead of relying on EventSource's
 * native retry, which would just keep resending the already-consumed ticket.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const sourceRef = useRef<EventSource | null>(null);
    const listenersRef = useRef<Map<string, Set<Handler<unknown>>>>(new Map());
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stoppedRef = useRef(false);
    const branchIdRef = useRef<string | number | null>(null);

    /** Cached per connection — see src/lib/branch.ts for how the branch itself is resolved. */
    const resolveBranchId = useCallback(async (): Promise<string | number | null> => {
        if (branchIdRef.current) return branchIdRef.current;
        const branchId = await resolveBranchIdShared();
        if (branchId) branchIdRef.current = branchId;
        return branchId;
    }, []);

    const attachToSource = useCallback((source: EventSource, eventName: string) => {
        source.addEventListener(eventName, (event: MessageEvent) => {
            const payload = event.data ? JSON.parse(event.data) : null;
            listenersRef.current.get(eventName)?.forEach((handler) => handler(payload));
        });
    }, []);

    const scheduleReconnect = useCallback((delayMs: number) => {
        if (stoppedRef.current) return;
        reconnectTimerRef.current = setTimeout(() => connect(), delayMs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const connect = useCallback(async () => {
        if (stoppedRef.current) return;
        try {
            const branchId = await resolveBranchId();

            if (!branchId) {
                scheduleReconnect(NO_BRANCH_RETRY_MS);
                return;
            }

            const { ticket, baseUrl } = await requestSseTicket(branchId);
            if (stoppedRef.current) return;

            const source = new EventSource(`${baseUrl}/api/sse/stream?ticket=${ticket}`);
            source.onerror = () => {
                source.close();
                if (sourceRef.current === source) {
                    sourceRef.current = null;
                }
                scheduleReconnect(RECONNECT_DELAY_MS);
            };

            listenersRef.current.forEach((_, eventName) => attachToSource(source, eventName));
            sourceRef.current = source;
        } catch (error) {
            scheduleReconnect(RECONNECT_DELAY_MS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attachToSource, scheduleReconnect, resolveBranchId]);

    useEffect(() => {
        stoppedRef.current = false;
        connect();
        return () => {
            stoppedRef.current = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            sourceRef.current?.close();
            sourceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const on = useCallback(
        (eventName: string, handler: Handler<unknown>) => {
            let handlers = listenersRef.current.get(eventName);
            const isNewEventName = !handlers;
            if (!handlers) {
                handlers = new Set();
                listenersRef.current.set(eventName, handlers);
            }
            handlers.add(handler);

            if (isNewEventName && sourceRef.current) {
                attachToSource(sourceRef.current, eventName);
            }

            return () => {
                listenersRef.current.get(eventName)?.delete(handler);
            };
        },
        [attachToSource]
    );

    // Cast unique et volontaire à la frontière : `on` est implémenté de façon générique
    // en interne (payload: unknown, comme n'importe quel event emitter), mais exposé
    // avec un type public précis par event name (voir NotificationPayloads ci-dessus)
    // pour que chaque appelant reçoive le bon shape sans re-caster à chaque site d'écoute.
    return (
        <NotificationsContext.Provider value={{ on: on as NotificationsContextType['on'] }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error("useNotifications doit être utilisé à l'intérieur d'un NotificationsProvider");
    }
    return context;
}
