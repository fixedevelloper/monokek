import * as catalogApi from "@/src/lib/api/catalog";
import * as stockApi from "@/src/lib/api/stock";

export interface StockPdfResult {
    blob: Blob;
    total: number;
    places: string[];
}

/**
 * PDF du catalogue avec les quantités en stock par lieu : l'entrepôt d'abord, puis chaque succursale.
 * Un compte de succursale ne reçoit que son propre lieu (listStockLocations filtre côté serveur).
 * Une cellule « - » = le produit n'existe pas (ou n'est pas suivi) à cet endroit.
 */
export async function buildStockPdf(branchId: number | null): Promise<StockPdfResult> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

    const locations = (await stockApi.listStockLocations())
        .slice()
        .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "WAREHOUSE" ? -1 : 1));
    const [products, itemsByLocation] = await Promise.all([
        catalogApi.listProductsAdmin(),
        Promise.all(locations.map((l) => stockApi.listStockItems(l.id))),
    ]);

    const qtyAt = itemsByLocation.map((items) => new Map(items.products.map((p) => [p.id, p.qty])));
    const rows = products
        .filter((p) => branchId === null || (p.branch_ids ?? [p.category.branch_id]).includes(branchId))
        .sort((a, b) => a.category.name.localeCompare(b.category.name) || a.name.localeCompare(b.name));

    const head = ["Produit", "Catégorie", "Prix", ...locations.map((l) => l.name), "Total"];
    const body = rows.map((p) => {
        const qtys = qtyAt.map((m) => m.get(p.id));
        const total = qtys.reduce<number>((sum, q) => sum + (q ?? 0), 0);
        return [
            p.name,
            p.category.name,
            String(p.price),
            ...qtys.map((q) => (q === undefined ? "-" : String(q))),
            qtys.every((q) => q === undefined) ? "-" : String(total),
        ];
    });

    const doc = new jsPDF({ orientation: "landscape" });
    const date = new Date().toLocaleDateString("fr-FR");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Stock des produits par lieu", 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`${rows.length} produits · ${locations.map((l) => l.name).join(", ")} · ${date}`, 14, 22);

    autoTable(doc, {
        startY: 27,
        head: [head],
        body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: Object.fromEntries(head.slice(2).map((_, i) => [i + 2, { halign: "right" as const }])),
        didDrawPage: () => {
            const n = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.text(`Page ${n}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
        },
    });

    return { blob: doc.output("blob"), total: rows.length, places: locations.map((l) => l.name) };
}
