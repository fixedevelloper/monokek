import { useState } from "react";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import { unwrapRaw } from "@/src/lib/api/http";

interface ExportOptions {
    filename: string;
    title: string;
    subtitle?: string;
    columns: string[];
}

/** Même couleur d'accent que PdfReportWriter côté backend (journaux comptables) — un seul
 * repère visuel de marque cohérent, que le PDF vienne du serveur ou soit généré ici. */
const ACCENT: [number, number, number] = [79, 70, 229];
const GRAY: [number, number, number] = [110, 110, 110];

export const useExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = async (options: ExportOptions, data: (string | number)[][]) => {
        setIsExporting(true);

        try {
            // Chargés à la demande : jsPDF/autoTable ne pèsent que sur le clic
            // "Exporter", pas sur le chargement initial des pages qui utilisent ce hook.
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);

            // Même source que le reçu imprimé (StoreSettings côté backend) — l'échec est
            // silencieux (un nom d'établissement manquant ne doit jamais bloquer l'export).
            let storeName = "Mono-Kek";
            try {
                const settings = await api.get('/api/admin/settings');
                const raw = unwrapRaw<Record<string, unknown>>(settings);
                if (typeof raw.store_name === 'string' && raw.store_name.trim()) {
                    storeName = raw.store_name;
                }
            } catch {
                // Nom d'établissement générique par défaut, voir ci-dessus.
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // En-tête : identité de l'établissement, puis titre/période du rapport.
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...ACCENT);
            doc.text(storeName, 14, 18);

            doc.setDrawColor(...ACCENT);
            doc.setLineWidth(0.8);
            doc.line(14, 23, pageWidth - 14, 23);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(20, 20, 20);
            doc.text(options.title, 14, 34);

            let bodyStartY = 40;
            if (options.subtitle) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(...GRAY);
                doc.text(options.subtitle, 14, 40);
                bodyStartY = 46;
            }

            // autoTable dessine les pages une à une : au moment où on dessine la page 1, le
            // nombre total de pages n'est pas encore connu si d'autres suivent. On imprime donc
            // un espace réservé et on le remplace partout d'un coup après coup via putTotalPages
            // (mécanisme standard jsPDF pour ce cas précis).
            const totalPagesPlaceholder = '{total_pages_count_string}';

            autoTable(doc, {
                startY: bodyStartY,
                head: [options.columns],
                body: data,
                theme: 'striped',
                headStyles: { fillColor: ACCENT, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
                // Pied de page sur chaque page : horodatage + numérotation.
                didDrawPage: (hookData) => {
                    const pageHeight = doc.internal.pageSize.getHeight();
                    doc.setDrawColor(225, 225, 230);
                    doc.setLineWidth(0.3);
                    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...GRAY);
                    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, pageHeight - 9);

                    const pageLabel = `Page ${hookData.pageNumber} / ${totalPagesPlaceholder}`;
                    doc.text(pageLabel, pageWidth - 14 - doc.getTextWidth(pageLabel), pageHeight - 9);
                },
                margin: { bottom: 22 },
            });

            if (typeof doc.putTotalPages === 'function') {
                doc.putTotalPages(totalPagesPlaceholder);
            }

            doc.save(`${options.filename}_${new Date().getTime()}.pdf`);
            toast.success("Export PDF réussi");
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Échec de l'exportation");
        } finally {
            setIsExporting(false);
        }
    };

    return { exportToPDF, isExporting };
};