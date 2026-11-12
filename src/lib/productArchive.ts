import JSZip from "jszip";
import Papa from "papaparse";
import type { Product } from "@/src/types/menus";

/**
 * Export/import du catalogue : `produits.csv` + dossier `images/` dans un seul zip.
 * Colonnes du CSV : name, price, category, description, sku, stock, active, image_file.
 * À l'import seules name/price/category/description/image_file sont utilisées (le stock ne doit
 * bouger que par ajustement tracé, cf. adjustProductStock) ; les autres colonnes sont informatives.
 */
export const CSV_NAME = "produits.csv";
export const IMAGES_DIR = "images/";

export interface ArchiveRow {
    name?: string;
    price?: string;
    category?: string;
    description?: string;
    sku?: string;
    stock?: string;
    active?: string;
    image_file?: string;
}

export interface ParsedArchive {
    rows: ArchiveRow[];
    /** image_file (chemin dans le zip) → fichier image. */
    images: Map<string, Blob>;
}

export interface ExportResult {
    blob: Blob;
    total: number;
    withImage: number;
    failedImages: string[];
}

const MIME_EXT: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif",
};
const EXT_MIME: Record<string, string> = Object.fromEntries(Object.entries(MIME_EXT).map(([m, e]) => [e, m]));
EXT_MIME["jpeg"] = "image/jpeg";

function slugify(s: string): string {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "produit";
}

function extensionOf(url: string, mime: string): string {
    if (MIME_EXT[mime]) return MIME_EXT[mime];
    const m = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url);
    return m ? m[1].toLowerCase() : "jpg";
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) await fn(items[next++]);
    }));
}

export async function buildProductsArchive(
    products: Product[],
    onProgress?: (done: number, total: number) => void,
): Promise<ExportResult> {
    const zip = new JSZip();
    const imagesDir = zip.folder("images")!;
    const imageFile = new Map<number, string>();
    const failedImages: string[] = [];

    const withUrl = products.filter((p) => p.image_url);
    let done = 0;
    await mapLimit(withUrl, 5, async (p) => {
        try {
            const res = await fetch(p.image_url!);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const file = `${p.id}-${slugify(p.name)}.${extensionOf(p.image_url!, blob.type)}`;
            imagesDir.file(file, blob);
            imageFile.set(p.id, IMAGES_DIR + file);
        } catch {
            failedImages.push(p.name); // un produit sans image exportable ne bloque pas l'export
        } finally {
            onProgress?.(++done, withUrl.length);
        }
    });

    const csv = Papa.unparse(
        products.map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category.name,
            description: p.description ?? "",
            sku: p.sku ?? "",
            stock: p.track_stock ? p.stock_count : "",
            active: p.is_active ? "1" : "0",
            image_file: imageFile.get(p.id) ?? "",
        })),
        { columns: ["name", "price", "category", "description", "sku", "stock", "active", "image_file"] },
    );
    zip.file(CSV_NAME, "﻿" + csv); // BOM : Excel ouvre l'UTF-8 correctement

    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    return { blob, total: products.length, withImage: imageFile.size, failedImages };
}

export async function parseProductsArchive(file: File): Promise<ParsedArchive> {
    const zip = await JSZip.loadAsync(file);
    const csvEntry = zip.file(CSV_NAME) ?? zip.file(/(^|\/)[^/]+\.csv$/i)[0];
    if (!csvEntry) throw new Error("Le zip ne contient pas de fichier produits.csv.");

    const text = (await csvEntry.async("string")).replace(/^﻿/, "");
    const parsed = Papa.parse<ArchiveRow>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
    const rows = parsed.data.filter((r) => (r.name ?? "").trim() !== "");

    const images = new Map<string, Blob>();
    for (const row of rows) {
        const path = (row.image_file ?? "").trim().replace(/\\/g, "/");
        if (!path || images.has(path)) continue;
        const entry = zip.file(path);
        if (!entry) continue;
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const bytes = await entry.async("blob");
        images.set(path, bytes.type ? bytes : new Blob([bytes], { type: EXT_MIME[ext] ?? "application/octet-stream" }));
    }
    return { rows, images };
}

/** « Enregistrer sous » natif dans Tauri ; téléchargement classique dans un navigateur. */
export async function saveBlob(blob: Blob, defaultName: string): Promise<boolean> {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({ defaultPath: defaultName, filters: [{ name: "Archive ZIP", extensions: ["zip"] }] });
        if (!path) return false;
        await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
        return true;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
}
