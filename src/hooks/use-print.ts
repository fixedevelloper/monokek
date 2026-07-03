import { useState, useEffect, useCallback } from 'react';
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

  /**
   * Charger les paramètres de la boutique
   */
  const fetchSettings = useCallback(async () => {
    console.log("[SettingsFetch] [Début] Tentative de récupération des paramètres depuis l'API...");
    setLoadingSettings(true);
    try {
      const { data } = await api.get('api/admin/settings');
      console.log("[SettingsFetch] [Succès] Paramètres reçus avec succès de l'API :", data);
      setSettings(data);
    } catch (error) {
      console.error("[SettingsFetch] [Erreur] Impossible de récupérer les paramètres d'impression :", error);
    } finally {
      console.log("[SettingsFetch] [Fin] Fin du processus de récupération. Passage de loading à false.");
      setLoadingSettings(false);
    }
  }, []);

  // Déclenchement automatique au montage du composant qui utilise le hook
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Structure pour les bons de Cuisine / Bar
   */
  const generateKitchenSections = (order: any, station: string) => {
    // ── Date et heure d'impression ────────────────────────────────────────────
    const now = new Date();
    const printedAt = now.toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    });
    const printedAtTime = now.toLocaleTimeString('fr-FR', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const printedAtFull = `${printedAt}  ${printedAtTime}`;

    const items = order.items || [];

    const sections = [
      title(`BON ${station}`),
      text(`TABLE : ${order.table?.name || 'N/A'}`, { align: TEXT_ALIGN.CENTER, bold: true }),
      text(`Serveur : ${order.cashier?.name || 'N/A'}`, { align: TEXT_ALIGN.CENTER }),
      // ✅ Date et heure d'impression
      text(printedAtFull, { align: TEXT_ALIGN.CENTER }),
      line("="),

      ...items.flatMap((item: any) => [
        text(`${item.qty}x ${item.product?.name?.toUpperCase() || 'PRODUIT INCONNU'}`, { bold: true }),
        ...(item.modifiers || []).map((m: any) =>
            text(`  + ${m.modifier_item?.name}`, { italic: true })
        ),
        item.note ? text(`  NOTE : ${item.note}`, { bold: true }) : null,
      ].filter(Boolean)),

      line("-"),
      text(`Ref : ${order.reference}`, { align: TEXT_ALIGN.CENTER, size: TEXT_SIZE.NORMAL }),
      beep(1, 2),
      feed(3),
      cut(),
    ];

    return sections;
  };

  /**
   * Structure pour le Ticket de Caisse Client (Facture)
   */
  const generateReceiptSections = (order: any, jobStore?: any) => {
    const store = jobStore || order?.store || {};
    const sections: any[] = [];

    // ── Date et heure d'impression ────────────────────────────────────────────
    const now = new Date();
    const printedAt = now.toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    });
    const printedAtTime = now.toLocaleTimeString('fr-FR', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const printedAtFull = `${printedAt}  ${printedAtTime}`;

    // 1. LOGO
    if (store.store_logo) {
      const cleanBase64 = store.store_logo.replace(/^data:image\/\w+;base64,/, "");
      sections.push(
          image(cleanBase64, {
            max_width: 0,
            align:     TEXT_ALIGN.CENTER,
            dithering: true,
            size:      IMAGE_MODE.NORMAL,
          })
      );
    }

    // 2. EN-TÊTE ENSEIGNE
    const storeName = (store.store_name || "MONO-KEP RESTO").toUpperCase();
    sections.push(text(storeName, { align: TEXT_ALIGN.CENTER, bold: true, size: TEXT_SIZE.DOUBLE }));

    if (store.store_address) sections.push(text(store.store_address, { align: TEXT_ALIGN.CENTER }));
    if (store.store_phone)   sections.push(text(`Tél : ${store.store_phone}`, { align: TEXT_ALIGN.CENTER }));

    // ✅ Date et heure d'impression
    sections.push(
        text(printedAtFull, { align: TEXT_ALIGN.CENTER })
    );

    // 3. INFOS COMMANDE
    const tableName   = order?.table?.name           || 'N/A';
    const waiterName  = order?.user?.name || order?.waiter?.name || 'N/A';
    const cashierName = order?.cashier?.name         || 'N/A';

    sections.push(
        line("-"),
        text(`Table    : ${tableName}`),
        text(`Facture  : ${order?.reference || 'N/A'}`),
        text(`Serveur  : ${waiterName}`),
        text(`Caissier : ${cashierName}`),
        line("-")
    );

    // 4. ROUNDS
    const rounds = order?.rounds || [];

    rounds.forEach((round: any, index: number) => {
      const roundItems = round.items || [];
      if (roundItems.length === 0) return;

      sections.push(
          text(`--- SERVICE #${index + 1} ---`, { align: TEXT_ALIGN.CENTER, bold: true })
      );

      const tableBody = roundItems.map((i: any) => [
        { text: String(i.qty) },
        { text: i.product?.name || 'Produit inconnu' },
        { text: String(i.price || 0) },
        { text: String(i.total) },
      ]);

      sections.push(
          table(4, tableBody, {
            column_widths: [5, 19, 10, 14],
            header: [
              { text: "QTY" },
              { text: "ARTICLE" },
              { text: "P.UNIT" },
              { text: "TOTAL" },
            ],
            truncate: true,
          }),
          feed(1)
      );
    });

    // 5. TOTAL & PAIEMENTS
    sections.push(
        line("="),
        text(`TOTAL : ${order?.total || 0} XAF`, { bold: true, size: TEXT_SIZE.DOUBLE, align: TEXT_ALIGN.RIGHT }),
        line("-")
    );

    const payments = order?.payments || [];
    if (payments.length > 0) {
      sections.push(text("RÈGLEMENTS :", { bold: true }));
      payments.forEach((payment: any) => {
        const methodName = payment.payment_method?.name || payment.payment_method_name || "Espèces";
        sections.push(
            text(`${methodName.padEnd(20, '.')} : ${payment.amount || 0} XAF`, { align: TEXT_ALIGN.LEFT })
        );
      });
    } else {
      sections.push(text("RÈGLEMENT : Non soldé ou en attente", { italic: true }));
    }

    // 6. PIED DE TICKET
    sections.push(
        line("-"),
        feed(1),
        text("Merci de votre visite !", { align: TEXT_ALIGN.CENTER }),
        // ✅ Rappel date/heure en bas pour archivage client
        text(`Imprimé le ${printedAtFull}`, { align: TEXT_ALIGN.CENTER }),
        feed(1),
        qr(String(order?.reference || 'N/A'), {
          size:             4,
          error_correction: QR_ERROR_CORRECTION.M,
          model:            2,
          align:            TEXT_ALIGN.CENTER,
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
    console.log(`[PrintJob] [Début] Traitement du job #${job.id} (Type: ${job.job_type})`);

    if (!isTauri()) {
      console.warn(`[PrintJob] [Annulé] Le job #${job.id} a été stoppé car l'environnement n'est pas Tauri.`);
      return;
    }

    try {
      // 1. Récupération / Configuration de l'imprimante
      const printer = job.printer || { name: "XP-80", connection: "usb", paper_width: "80" };
      console.log(`[PrintJob] [Configuration] Imprimante cible pour le job #${job.id} :`, printer);

      // 2. Validation de la configuration réseau
      if (printer.connection === 'network' && !printer.ip) {
        throw new Error(`L'imprimante ${printer.name} n'a pas d'adresse IP configurée.`);
      }

      // 3. Génération du contenu selon le type de job
      let jobSections: any[] = [];
      const order = job.content.order;
      console.log(`[PrintJob] [Génération] Début de la génération des sections pour le type : ${job.job_type}`);

      switch (job.job_type) {
        case 'kitchen':
        case 'bar':
          jobSections = generateKitchenSections(order, job.job_type.toUpperCase());
          break;
        case 'receipt':
          jobSections = generateReceiptSections(order, job.content?.store);
          break;
        default:
          console.warn(`[PrintJob] [Attention] Type de job inconnu : ${job.job_type}. Abandon du traitement.`);
          return;
      }

      console.log(`[PrintJob] [Génération] ${jobSections.length} sections générées avec succès pour le job #${job.id}.`);

      // 4. Formatage de la requête pour le plugin Rust
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
      console.log(`[PrintJob] [Payload] Structure PrintJobRequest prête pour Rust :`, printJob);

      // 5. Envoi à l'imprimante thermique via Tauri
      console.log(`[PrintJob] [Impression] Envoi du job #${job.id} au plugin Rust (print_thermal_printer)...`);
      await print_thermal_printer(printJob);
      console.log(`[PrintJob] [Impression] Le plugin Rust a confirmé l'envoi pour le job #${job.id}.`);

      // 6. Notification de succès au serveur local
      console.log(`[PrintJob] [API] Marquage du job #${job.id} comme réussi sur le serveur...`);
      await api.post(`/api/print-queue/${job.id}/mark-success`);
      console.log(`[PrintJob] [Succès] Le job #${job.id} a été traité et synchronisé avec succès.`);

    } catch (error) {
      console.error(`[PrintJob] [Erreur] Échec critique lors du traitement du job #${job.id} :`, error);

      try {
        console.log(`[PrintJob] [API] Tentative de marquage du job #${job.id} comme échoué sur le serveur...`);
        await api.post(`/api/print-queue/${job.id}/mark-failed`, { error: String(error) });
        console.log(`[PrintJob] [API] Job #${job.id} marqué comme échoué sur le serveur.`);
      } catch (apiError) {
        console.error(`[PrintJob] [Erreur API] Impossible de notifier le serveur de l'échec pour le job #${job.id} :`, apiError);
      }

      toast.error(`Erreur d'impression : ${job.job_type}`);
    }
  };

  /**
   * Polling de secours de la file d'attente
   */
  const checkPendingJobs = async () => {
    console.log("[QueuePoll] [Début] Vérification des impressions en attente sur le serveur...");
    try {
      const { data } = await api.get('/api/print-queue/pending');
      console.log(`[QueuePoll] [Résultat] ${data.length} job(s) en attente trouvé(s).`);

      for (const job of data) {
        await processPrintJob(job);
      }
    } catch (err) {
      console.error("[QueuePoll] [Erreur] Échec lors de la récupération des jobs en attente :", err);
    }
  };

  return {
    processPrintJob,
    checkPendingJobs,
    fetchSettings, // Rendu accessible à l'extérieur si tu veux forcer un refresh manuel
    loadingSettings,
    settings
  };
};