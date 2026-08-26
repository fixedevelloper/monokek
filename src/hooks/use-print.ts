import { useState, useEffect, useCallback } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { print_thermal_printer, ENCODE } from "tauri-plugin-thermal-printer";
import api from "../lib/axios";
import { unwrapRaw } from "../lib/api/http";
import * as printingApi from "../lib/api/printing";
import { renderTicketSections } from "../lib/printing/renderTicket";

/**
 * A USB print job as consumed by {@link processPrintJob} — the shape shared
 * by real jobs (from the `print-job-queued` SSE push or the `/pending`
 * catch-up fetch) and the "Tester" button's synthetic job. Network jobs
 * never reach this: the server already renders and sends them synchronously
 * via NetworkPrintDispatcher the moment they're queued.
 */
export interface UsbPrintJob {
  /** Numeric for a real PrintQueue row (enables mark-success/mark-failed); a string (e.g. "TEST_...") for a local-only test print. */
  id: number | string;
  jobType: string;
  osPrinterName: string | null;
  paperWidth?: number;
  /** Raw JSON string — KitchenTicketContent/ReceiptContent/SessionSummaryContent, matching `jobType`. */
  content: string;
}

/**
 * Numeric job ids already sent to the OS printer this app session — guards
 * against a job being delivered twice (the SSE `print-job-queued` push and
 * the `/pending` catch-up fetch can both resolve the same still-unacked job
 * if they race at login) and printing two physical tickets for one job.
 */
const processedJobIds = new Set<number>();

export const usePrint = () => {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const response = await api.get('/api/admin/settings');
      setSettings(unwrapRaw(response));
    } catch (error) {
      console.error("[usePrint] Impossible de charger les paramètres :", error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /** Renders and sends a USB job via the local OS printer, then acks the backend for real (numeric-id) jobs. */
  const processPrintJob = async (job: UsbPrintJob) => {
    if (!isTauri()) {
      console.warn(`[usePrint] Impression locale ignorée (hors environnement Desktop/Tauri) pour le job #${job.id}`);
      return;
    }
    if (!job.osPrinterName) {
      console.warn(`[usePrint] Job #${job.id} : aucune imprimante locale (OS) configurée.`);
      return;
    }
    if (typeof job.id === "number" && processedJobIds.has(job.id)) {
      console.warn(`[usePrint] Job #${job.id} déjà imprimé dans cette session, doublon ignoré.`);
      return;
    }

    try {
      if (typeof job.id === "number") processedJobIds.add(job.id);
      // Mirrors PaperSize::chars_per_line in the Rust plugin (Mm58 -> 32, Mm80 -> 48).
      const charsPerLine = job.paperWidth === 58 ? 32 : 48;
      const sections = await renderTicketSections(job.jobType, job.content, charsPerLine);
      await print_thermal_printer({
        printer: job.osPrinterName,
        paper_size: job.paperWidth === 58 ? "Mm58" : "Mm80",
        // code_page 0 + ACCENT_REMOVER prints on any ESC/POS printer regardless of its
        // code page table (accents get transliterated, e.g. "é" -> "e") — safer default
        // than a fixed raw code_page value, which maps to a different character set on
        // every printer model and was producing garbled/illegible text on this one.
        options: { code_page: 0, encode: ENCODE.ACCENT_REMOVER, use_gbk: false },
        sections,
      });
      if (typeof job.id === "number") {
        await printingApi.markPrintJobSuccess(job.id);
      }
    } catch (error) {
      console.error(`[usePrint] Échec d'impression du job #${job.id} :`, error);
      if (typeof job.id === "number") {
        await printingApi.markPrintJobFailed(job.id).catch(() => {});
      }
      throw error;
    }
  };

  return {
    processPrintJob,
    fetchSettings,
    loadingSettings,
    settings
  };
};
