import { isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { ENCODE, print_thermal_printer, type PrintJobRequest } from "tauri-plugin-thermal-printer";
import { getLocalSettings } from "../lib/storage";
import axios from 'axios';
import api from "../lib/axios"; // Assurez-vous d'avoir axios ou votre instance API
export const usePrint = () => {

  /**
   * Formate l'objet pour le plugin thermal (Adapté au Réseau)
   */
  const buildPrintJob = (printer: any, sections: any[]) => ({
    // Si connection === 'network', on utilise l'IP, sinon le nom (USB)
    printer: printer.connection === 'network' ? printer.ip : printer.name,
    connection_type: printer.connection, // On passe l'info au plugin
    port: printer.port || 9100,
    paper_size: (printer.paper_width === "58" ? "58mm" : "80mm"),
    options: {
      code_page: 6,
      encode: ENCODE.WINDOWS_1252,
    },
    sections: sections,
    truncate: true
  });

  const processPrintJob = async (job: any) => {
    if (!isTauri()) return;

    try {
      // Priorité à l'imprimante définie dans le job, sinon fallback
      const printer = job.printer || { name: "XP-80", connection: "usb" };

      // Sécurité : si réseau mais pas d'IP
      if (printer.connection === 'network' && !printer.ip) {
        console.log(`L'imprimante ${printer.name} n'a pas d'adresse IP configurée.`)
        throw new Error(`L'imprimante ${printer.name} n'a pas d'adresse IP configurée.`);
      }

      let sections: any[] = [];
      const order = job.content.order;

      switch (job.job_type) {
        case 'kitchen':
        case 'bar':
          sections = generateKitchenSections(order, job.job_type.toUpperCase());
          break;
        case 'receipt':
          sections = generateReceiptSections(order);
          break;
        default:
          console.warn("Type de job inconnu:", job.job_type);
          return;
      }

      const printJob = buildPrintJob(printer, sections);
      await print_thermal_printer(printJob as PrintJobRequest);

      await api.post(`/api/print-queue/${job.id}/mark-success`);
    } catch (error) {
      console.error(`Erreur impression Job #${job.id}:`, error);
      await api.post(`/api/print-queue/${job.id}/mark-failed`, { error: String(error) });
      toast.error(`Erreur d'impression : ${job.job_type}`);
    }
  };

  /**
   * Structure Cuisine (Inclus Table et Modificateurs)
   */
  const generateKitchenSections = (order: any, station: string) => {
    const items = order.items || [];

    return [
      { Text: { text: `BON ${station}`, styles: { align: "center", bold: true, size: "large" } } },
      { Text: { text: `TABLE: ${order.table?.name || 'N/A'}`, styles: { align: "center", bold: true } } },
      { Text: { text: `Serveur: ${order.cashier?.name}`, styles: { align: "center" } } },
      { Line: { character: "=" } },
      ...items.flatMap((item: any) => [
        { Text: { text: `${item.qty}x ${item.product.name.toUpperCase()}`, styles: { bold: true } } },
        // Gestion des modificateurs (ex: Avocat)
        ...(item.modifiers || []).map((m: any) => ({
          Text: { text: `  + ${m.modifier_item.name}`, styles: { italic: true } }
        })),
        item.note ? { Text: { text: `  NOTE: ${item.note}`, styles: { bold: true } } } : null,
      ].filter(Boolean)), // Retire les entrées nulles
      { Line: { character: "-" } },
      { Text: { text: `Ref: ${order.reference}`, styles: { align: "center", size: "small" } } },
      { Feed: { feed_type: "lines", value: 3 } },
      { Cut: { mode: "full", feed: 3 } },
      { Beep: { times: 2, duration: 200 } }
    ];
  };

  /**
   * Structure Ticket de Caisse
   */
  const generateReceiptSections = (order: any) => [
    { Text: { text: "MONO-KEP RESTO", styles: { align: "center", bold: true } } },
    { Text: { text: `Table: ${order.table?.name}`, styles: { align: "center" } } },
    { Line: { character: "-" } },
    {
      Table: {
        columns: 3,
        column_widths: [8, 28, 12],
        header: [{ text: "Qté" }, { text: "Article" }, { text: "Total" }],
        body: order.items.map((i: any) => [
          { text: String(i.qty) },
          { text: i.product.name },
          { text: String(i.total) }
        ]),
        truncate: true
      }
    },
    { Line: { character: "=" } },
    { Text: { text: `TOTAL: ${order.total} XAF`, styles: { align: "right", bold: true } } },
    { Feed: { feed_type: "lines", value: 2 } },
    { Qr: { data: String(order.reference), size: 4, error_correction: "M", model: 2 } },
    { Cut: { mode: "full", feed: 3 } }
  ];
  /**
   * Fonction pour forcer la vérification de la file d'attente (Polling de secours)
   */
  const checkPendingJobs = async () => {
    try {
      const { data } = await api.get('/api/print-queue/pending');
      for (const job of data) {
        await processPrintJob(job);
      }
    } catch (err) {
      console.error("Erreur check pending jobs", err);
    }
  };

  return { processPrintJob, checkPendingJobs };
};