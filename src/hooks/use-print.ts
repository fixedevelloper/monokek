import { useState, useEffect, useCallback } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import {
  print_thermal_printer,
  type PrintJobRequest,
  text,
  line,
  feed,
  cut,
  ENCODE,
} from "tauri-plugin-thermal-printer";
import api from "../lib/axios";

export const usePrint = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data } = await api.get('api/admin/settings');
      setSettings(data);
    } catch (error) {
      console.error("[usePrint] Impossible de charger les paramètres :", error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Enclenche le processus d'impression universel
   */
  const processPrintJob = async (job: any) => {
    console.log(`[usePrint] Début traitement Job #${job.id} (Type: ${job.job_type})`);

    const printer = job.printer || { connection: "usb", name: "XP-80", paper_width: "80" };
    const order = job.content?.order;

    if (!order) {
      toast.error("Données de la commande manquantes.");
      return;
    }

    try {
      // ── CAS UNIQUE ET ASSURÉ POUR LE RÉSEAU (PC, TABLETTES ANDROID) ──────────
      if (printer.connection === 'network') {
       // console.log(`[usePrint] Routage réseau direct vers Laravel pour IP : ${printer.ip}`);

        await api.post(`/api/print-queue/${job.id}/dispatch-network`, {
          ip: printer.ip,
          port: printer.port ?? 9100,
          job_type: job.job_type,
          order: order,
          store: job.content?.store || {}
        });

        toast.success(`Impression envoyée (${job.job_type})`);
        return;
      }

      // ── CAS DE SECOURS : USB LOCAL UNIQUE (Uniquement disponible sur PC via l'app Tauri) ──
      if (!isTauri()) {
        console.warn("[usePrint] Impression locale USB ignorée (hors environnement Desktop/Tauri).");
        return;
      }

      // Exemple basique si vous branchez temporairement un Xprinter en USB sur un PC fixe
      const localSections = [
        text(`TICKET DE SECOURS USB`),
        line("-"),
        text(`REF : ${order.reference}`),
        feed(3),
        cut()
      ];

      const printJobPayload: PrintJobRequest = {
        printer: printer.name,
        paper_size: printer.paper_width === "58" ? "Mm58" : "Mm80",
        options: { code_page: 6, encode: ENCODE.WINDOWS_1252, use_gbk: false },
        sections: localSections
      };

      await print_thermal_printer(printJobPayload);
      await api.post(`/api/print-queue/${job.id}/mark-success`);

    } catch (error: any) {
     // console.error(`[usePrint] Erreur critique sur le job #${job.id}:`, error);
    //  toast.error(`Erreur d'impression : ${error?.response?.data?.error || "Vérifiez l'imprimante"}`);
    }
  };

  /**
   * Appelé par le polling régulier de votre application
   */
  const checkPendingJobs = async () => {
    try {
    /*  const { data } = await api.get('/api/print-queue/pending');
      for (const job of data) {
        await processPrintJob(job);
      }*/
    } catch (err) {
      console.error("[usePrint] Échec récupération file d'attente :", err);
    }
  };

  return {
    processPrintJob,
    checkPendingJobs,
    fetchSettings,
    loadingSettings,
    settings
  };
};