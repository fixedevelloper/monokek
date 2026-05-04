import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ExportOptions {
    filename: string;
    title: string;
    subtitle?: string;
    columns: string[];
}

export const useExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = async (options: ExportOptions, data: any[][]) => {
        setIsExporting(true);

        try {
            const doc = new jsPDF();

            // Design de l'en-tête
            doc.setFontSize(18);
            doc.text(options.title.toUpperCase(), 14, 20);

            if (options.subtitle) {
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(options.subtitle, 14, 28);
            }

            autoTable(doc, {
                startY: 35,
                head: [options.columns],
                body: data,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
            });


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