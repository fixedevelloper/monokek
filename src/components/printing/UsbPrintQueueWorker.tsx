"use client";

import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useAuthStore } from "../../store/use-auth-store";
import { useNotifications } from "../../providers/NotificationsProvider";
import { resolveBranchId } from "../../lib/branch";
import { usePrint, UsbPrintJob } from "../../hooks/use-print";
import * as printingApi from "../../lib/api/printing";

/**
 * The "LAN worker" for USB print jobs, running inside the Tauri POS app
 * itself rather than as a separate process — see monokek-fonctionnalites-oubliees.txt.
 * Real-time delivery is push-based (`print-job-queued` over the existing SSE
 * connection, see NotificationsProvider); the one-time `/pending` fetch on
 * (re)connect only exists to catch up on jobs queued while this app was
 * offline. Renders nothing.
 */
export function UsbPrintQueueWorker() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { on } = useNotifications();
    const { processPrintJob } = usePrint();
    const caughtUpRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !isTauri()) {
            caughtUpRef.current = false;
            return;
        }

        const catchUp = async () => {
            if (caughtUpRef.current) return;
            const branchId = await resolveBranchId();
            if (!branchId) return;
            caughtUpRef.current = true;
            try {
                const jobs = await printingApi.getPendingPrintJobs(branchId);
                for (const job of jobs) {
                    const usbJob: UsbPrintJob = {
                        id: job.id,
                        jobType: job.jobType,
                        osPrinterName: job.printerOsPrinterName,
                        content: job.content,
                    };
                    await processPrintJob(usbJob).catch(() => { /* already logged/acked in processPrintJob */ });
                }
            } catch (error) {
                console.error("[UsbPrintQueueWorker] Échec du rattrapage des jobs en attente :", error);
            }
        };

        catchUp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || !isTauri()) return;

        return on("print-job-queued", (payload) => {
            const usbJob: UsbPrintJob = {
                id: payload.jobId,
                jobType: payload.jobType,
                osPrinterName: payload.osPrinterName || null,
                content: payload.content,
            };
            processPrintJob(usbJob).catch(() => { /* already logged/acked in processPrintJob */ });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, on]);

    return null;
}
