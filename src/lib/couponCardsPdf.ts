import type { CouponDto } from "@/src/lib/api/types/crm";

export interface CouponCardsResult {
    blob: Blob;
    count: number;
}

// Carte au format bancaire (ISO ID-1), 2 colonnes x 5 lignes par page A4. Chaque carte a des coins arrondis et un
// contour fin en pointillés qui sert de guide de coupe.
const CARD_W = 85.6;
const CARD_H = 54;
const GUTTER_X = 4;
const GUTTER_Y = 2;
const COLS = 2;
const ROWS = 5;
const PAGE_W = 210;
const PAGE_H = 297;
const RADIUS = 3;
const STUB_W = 33; // volet de gauche : commerce + montant
const ORIGIN_X = (PAGE_W - (COLS * CARD_W + (COLS - 1) * GUTTER_X)) / 2;
const ORIGIN_Y = (PAGE_H - (ROWS * CARD_H + (ROWS - 1) * GUTTER_Y)) / 2;
export const CARDS_PER_PAGE = COLS * ROWS;

type Rgb = [number, number, number];
const NAVY: Rgb = [15, 15, 15];
const INDIGO: Rgb = [15, 15, 15];
const AMBER: Rgb = [251, 191, 36];
const INK: Rgb = [30, 30, 30];
const MUTED: Rgb = [110, 110, 110];
const PANEL: Rgb = [244, 244, 244];
const WHITE: Rgb = [255, 255, 255];

/** Coin haut-gauche de la n-ième carte d'une page. */
export function cardOrigin(indexOnPage: number): { x: number; y: number } {
    const col = indexOnPage % COLS;
    const row = Math.floor(indexOnPage / COLS);
    return { x: ORIGIN_X + col * (CARD_W + GUTTER_X), y: ORIGIN_Y + row * (CARD_H + GUTTER_Y) };
}

/** « 1 500 » avec une espace ordinaire : `toLocaleString("fr-FR")` insère une espace fine insécable (U+202F) que la police
 * standard de jsPDF ne sait pas dessiner (caractères parasites). */
export function pdfNumber(amount: number): string {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function pdfAmount(amount: number): string {
    return `${pdfNumber(amount)} FCFA`;
}

/** Un coupon que l'on peut encore remettre à un client. */
export function isUsable(c: CouponDto): boolean {
    return !c.expired && (c.maxUses == null || c.timesUsed < c.maxUses);
}

// jsPDF ne fournit pas le type de l'instance exportée par défaut sous un nom simple ; on décrit ce dont on se sert.
type Doc = InstanceType<typeof import("jspdf").jsPDF>;

/** Réduit la taille de police jusqu'à ce que le texte tienne dans `maxWidth`. */
function fitFont(doc: Doc, text: string, startSize: number, minSize: number, maxWidth: number): number {
    let size = startSize;
    doc.setFontSize(size);
    while (size > minSize && doc.getTextWidth(text) > maxWidth) {
        size -= 0.5;
        doc.setFontSize(size);
    }
    return size;
}

function drawCard(doc: Doc, x: number, y: number, c: CouponDto, store: string, qr: string) {
    // Fond blanc arrondi.
    doc.setFillColor(...WHITE);
    doc.roundedRect(x, y, CARD_W, CARD_H, RADIUS, RADIUS, "F");

    // Volet de gauche : arrondi à gauche, bord droit droit (on recouvre l'arrondi de droite).
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, y, STUB_W + RADIUS, CARD_H, RADIUS, RADIUS, "F");
    doc.setFillColor(...WHITE);
    doc.rect(x + STUB_W, y, RADIUS + 0.2, CARD_H, "F");

    // Liseré d'accent le long du volet.
    doc.setFillColor(...AMBER);
    doc.rect(x + STUB_W - 1.2, y + 4, 1.2, CARD_H - 8, "F");

    // --- Volet : commerce, étiquette, montant.
    const cx = x + (STUB_W - 1.2) / 2;
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const nameLines = (doc.splitTextToSize(store, STUB_W - 8) as string[]).slice(0, 2);
    nameLines.forEach((line, k) => doc.text(line, cx, y + 9 + k * 3.4, { align: "center" }));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...AMBER);
    doc.text("BON DE RÉDUCTION", cx, y + 22, { align: "center", charSpace: 0.4 });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    const num = pdfNumber(c.amount);
    fitFont(doc, num, 24, 12, STUB_W - 9);
    doc.text(num, cx, y + 35, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...AMBER);
    doc.text("FCFA", cx, y + 41, { align: "center", charSpace: 0.6 });

    // --- Zone de droite.
    const rx = x + STUB_W + 5;
    const rw = CARD_W - STUB_W - 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...MUTED);
    doc.text("VOTRE CODE", rx, y + 8, { charSpace: 0.4 });

    // Code dans un cartouche, ajusté à la largeur.
    doc.setFillColor(...PANEL);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.roundedRect(rx, y + 10, rw, 9.5, 1.6, 1.6, "FD");
    doc.setLineDashPattern([], 0);
    doc.setFont("courier", "bold");
    doc.setTextColor(...NAVY);
    fitFont(doc, c.code, 14, 8, rw - 5);
    doc.text(c.code, rx + rw / 2, y + 16.4, { align: "center" });

    // Conditions (à gauche) et QR code (à droite).
    const qrSize = 19;
    const qrX = rx + rw - qrSize;
    const qrY = y + 23;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...INK);
    const conditions: string[] = [];
    if (c.minAmount != null) conditions.push(`Dès ${pdfAmount(c.minAmount)}`);
    if (c.expiresAt) conditions.push(`Exp. ${new Date(c.expiresAt).toLocaleDateString("fr-FR")}`);
    if (c.maxUses != null) conditions.push(`${c.maxUses} usage${c.maxUses > 1 ? "s" : ""} max.`);
    if (conditions.length === 0) conditions.push("Sans condition");
    conditions.slice(0, 3).forEach((line, k) => {
        doc.setFillColor(...INDIGO);
        doc.circle(rx + 0.9, y + 26.2 + k * 4.6, 0.55, "F");
        // Une condition ne passe jamais à la ligne (elle chevaucherait la suivante) : on réduit la police si besoin.
        doc.setFont("helvetica", "normal");
        fitFont(doc, line, 6, 4.5, rw - qrSize - 5);
        doc.text(line, rx + 2.8, y + 27 + k * 4.6);
    });

    doc.addImage(qr, "PNG", qrX, qrY, qrSize, qrSize);
    doc.setFontSize(5);
    doc.setTextColor(...MUTED);
    doc.text("Présentez ce code en caisse", rx, y + CARD_H - 4.2);

    // Contour (guide de coupe) par-dessus, en dernier.
    doc.setDrawColor(170, 170, 185);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([1, 1], 0);
    doc.roundedRect(x, y, CARD_W, CARD_H, RADIUS, RADIUS, "S");
    doc.setLineDashPattern([], 0);
}

/**
 * PDF de cartes de coupon prêtes à découper : commerce, montant, code, conditions, et un QR code qui encode le code
 * (pour un futur scan en caisse ; aujourd'hui le caissier tape le code).
 */
export async function buildCouponCardsPdf(coupons: CouponDto[], storeName: string): Promise<CouponCardsResult> {
    const [{ default: jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const store = (storeName || "MonoKek").toUpperCase();

    for (let i = 0; i < coupons.length; i++) {
        const indexOnPage = i % CARDS_PER_PAGE;
        if (i > 0 && indexOnPage === 0) doc.addPage();
        const { x, y } = cardOrigin(indexOnPage);
        const qr = await QRCode.toDataURL(coupons[i].code, { margin: 0, width: 192, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
        drawCard(doc, x, y, coupons[i], store, qr);
    }

    return { blob: doc.output("blob"), count: coupons.length };
}
