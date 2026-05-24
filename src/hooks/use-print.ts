import { useState, useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import {
  print_thermal_printer,
  type PrintJobRequest,
  title,
  text,
  line,
  feed,
  cut,
  beep,
  table,
  qr,
  image,
  ENCODE,
  TEXT_ALIGN,
  TEXT_SIZE,
  QR_ERROR_CORRECTION,
  IMAGE_MODE
} from "tauri-plugin-thermal-printer";
import api from "../lib/axios";

export const usePrint = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // Charger les paramètres de la boutique
  const fetchSettings = async () => {
    try {
      const { data } = await api.get('api/admin/settings');
      setSettings(data);
    } catch (error) {
      console.error("Erreur d'initialisation des paramètres d'impression:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * Structure pour les bons de Cuisine / Bar
   */
  const generateKitchenSections = (order: any, station: string) => {
    const items = order.items || [];

    return [
      title(`BON ${station}`),
      text(`TABLE : ${order.table?.name || 'N/A'}`, { align: TEXT_ALIGN.CENTER, bold: true }),
      text(`Serveur : ${order.cashier?.name || 'N/A'}`, { align: TEXT_ALIGN.CENTER }),
      line("="),

      ...items.flatMap((item: any) => [
        text(`${item.qty}x ${item.product.name.toUpperCase()}`, { bold: true }),
        ...(item.modifiers || []).map((m: any) =>
            text(`  + ${m.modifier_item.name}`, { italic: true })
        ),
        item.note ? text(`  NOTE : ${item.note}`, { bold: true }) : null,
      ].filter(Boolean)),

      line("-"),
      text(`Ref : ${order.reference}`, { align: TEXT_ALIGN.CENTER, size: TEXT_SIZE.NORMAL }),
      beep(1, 2),
      feed(3),
      cut()
    ];
  };

  /**
   * Structure pour le Ticket de Caisse Client (Facture)
   */
  /**
   * Structure pour le Ticket de Caisse Client (Facture)
   */
  const generateReceiptSections = (order: any) => {
    const store = settings || order.store || {};
    const sections: any[] = [];

    // 1. LOGO
    if (store.store_logo) {
      const cleanBase64 = store.store_logo.replace(/^data:image\/\w+;base64,/, "");
      sections.push(
          image(cleanBase64, {
            max_width: 0,
            align: TEXT_ALIGN.CENTER,
            dithering: true,
            size: IMAGE_MODE.NORMAL,
          })
      );
    }

    // 2. EN-TÊTE ENSEIGNE (Remplacé par la fonction text classique, plus stable que title)
    sections.push(text((store.store_name || "MONO-KEP RESTO").toUpperCase(), { align: TEXT_ALIGN.CENTER, bold: true, size: TEXT_SIZE.DOUBLE }));

    if (store.store_address) sections.push(text(store.store_address, { align: TEXT_ALIGN.CENTER }));
    if (store.store_bp)      sections.push(text(`BP : ${store.store_bp}`, { align: TEXT_ALIGN.CENTER }));
    if (store.store_phone)   sections.push(text(`Tél : ${store.store_phone}`, { align: TEXT_ALIGN.CENTER }));

    sections.push(
        line("-"),
        text(`Table : ${order.table?.name || 'N/A'}`),
        text(`Facture : ${order.reference}`),
        line("-")
    );

    // 3. TABLEAU DES ARTICLES (CORRECTION ICI : On passe des objets avec la propriété { text: "..." })
    const tableBody = (order.items || []).map((i: any) => [
      { text: String(i.qty) },
      { text: i.product.name },
      { text: String(i.total) }
    ]);

    sections.push(
        table(
            3,
            tableBody,
            {
              column_widths: [6, 28, 14],
              header: [
                { text: "QTY" },
                { text: "ITEM" },
                { text: "TOTAL" }
              ],
              truncate: true,
            }
        )
    );

    // 4. TOTAL & FIN DE TICKET
    sections.push(
        line("="),
        text(`TOTAL : ${order.total} XAF`, { bold: true, size: TEXT_SIZE.DOUBLE, align: TEXT_ALIGN.RIGHT }),
        feed(1),
        text("Merci de votre visite !", { align: TEXT_ALIGN.CENTER }),
        feed(1),
        qr(String(order.reference), {
          size: 4,
          error_correction: QR_ERROR_CORRECTION.M,
          model: 2,
          align: TEXT_ALIGN.CENTER,
        }),
        feed(3),
        cut()
    );

    return sections;
  };

  /**
   * Orchestre le processus d'impression selon le type de job
   */
  const processPrintJob = async (job: any) => {
    if (!isTauri()) return;

    try {
      const printer = job.printer || { name: "XP-80", connection: "usb", paper_width: "80" };

      if (printer.connection === 'network' && !printer.ip) {
        throw new Error(`L'imprimante ${printer.name} n'a pas d'adresse IP configurée.`);
      }

      let jobSections: any[] = [];
      const order = job.content.order;

      switch (job.job_type) {
        case 'kitchen':
        case 'bar':
          jobSections = generateKitchenSections(order, job.job_type.toUpperCase());
          break;
        case 'receipt':
          jobSections = generateReceiptSections(order);
          break;
        default:
          console.warn("Type de job inconnu :", job.job_type);
          return;
      }

      // Format strict du PrintJobRequest attendu à la racine par le plugin Rust
      const printJob: PrintJobRequest = {
        printer: printer.connection === 'network' ? printer.ip : printer.name,
        paper_size: printer.paper_width === "58" ? "Mm58" : "Mm80",
        options: {
          code_page: 6,
          encode: ENCODE.WINDOWS_1252,
          use_gbk: false
        },
        sections: jobSections
      };

      await print_thermal_printer(printJob);

      // Validation côté serveur local
      await api.post(`/api/print-queue/${job.id}/mark-success`);
    } catch (error) {
      console.error(`Erreur impression Job #${job.id} :`, error);
      await api.post(`/api/print-queue/${job.id}/mark-failed`, { error: String(error) });
      toast.error(`Erreur d'impression : ${job.job_type}`);
    }
  };

  /**
   * Polling de secours de la file d'attente
   */
  const checkPendingJobs = async () => {
    try {
      const { data } = await api.get('/api/print-queue/pending');
      for (const job of data) {
        await processPrintJob(job);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification des impressions en attente :", err);
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