import { PrintSections, cut, drawer, feed, image, line, qr, subtitle, table, text, title } from "tauri-plugin-thermal-printer";

/** Mirrors com.monokek.printing.application.dto.KitchenTicketContent (Jackson JSON, camelCase). */
interface KitchenTicketContent {
    orderId: number;
    roundId: number;
    tableName: string | null;
    serverName: string | null;
    note: string | null;
    items: { productName: string; qty: number; modifierNames: string[] }[];
}

/** Mirrors com.monokek.printing.application.dto.ReceiptContent. */
interface ReceiptContent {
    orderId: number;
    orderUuid: string;
    reference: string;
    storeName: string | null;
    storeAddress: string | null;
    storePhone: string | null;
    storeLogoUrl: string | null;
    tableName: string | null;
    serverName: string | null;
    cashierName: string | null;
    rounds: { roundNumber: number; items: ReceiptItem[] }[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string | null;
    amountReceived: number | null;
    changeDue: number | null;
}

interface ReceiptItem {
    productName: string;
    qty: number;
    unitPrice: number;
    total: number;
    modifierNames: string[];
}

/** Mirrors com.monokek.printing.application.dto.CouponContent. */
interface CouponContent {
    storeName: string | null;
    storeAddress: string | null;
    storePhone: string | null;
    code: string;
    amount: number;
    expiresAt: string | null;
}

/** Mirrors com.monokek.printing.application.dto.SessionSummaryContent. */
interface SessionSummaryContent {
    sessionId: number;
    storeName: string | null;
    cashierName: string | null;
    openedAt: string;
    closedAt: string;
    openingAmount: number;
    totalSales: number;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
    paymentBreakdown: { method: string; total: number }[];
    soldItems: { productName: string; qty: number; total: number }[];
}

/**
 * Client-side counterpart to EscPosTicketRenderer.java, used only for USB
 * jobs — network jobs are already rendered and sent server-side by
 * NetworkPrintDispatcher. Deliberately simpler (no logo/QR/cash-drawer
 * pulse): a readable, correct ticket, not a pixel match of the network one.
 */
/** @param charsPerLine Paper's characters-per-line (48 for 80mm, 32 for 58mm — see PaperSize::chars_per_line in the Rust plugin). column_widths passed to `table()` must sum to exactly this. */
export async function renderTicketSections(jobType: string, contentJson: string, charsPerLine = 48): Promise<PrintSections[]> {
    switch (jobType) {
        case "receipt":
            return renderReceipt(JSON.parse(contentJson) as ReceiptContent, charsPerLine);
        case "session_summary":
            return renderSessionSummary(JSON.parse(contentJson) as SessionSummaryContent, charsPerLine);
        case "coupon":
            return renderCoupon(JSON.parse(contentJson) as CouponContent);
        default:
            return renderKitchenTicket(JSON.parse(contentJson) as KitchenTicketContent);
    }
}

/**
 * Print-safe currency formatting — the shared `formatCurrency()` (Intl.NumberFormat,
 * fine for on-screen display) inserts U+202F/U+00A0 (narrow/no-break spaces) as
 * separators. Those aren't representable in the printer's ESC/POS code page and fall
 * through to raw UTF-8 bytes, printing as garbled characters inside every price.
 * Mirrors EscPosTicketRenderer.formatFcfa() (Java): manual grouping with a plain
 * ASCII space, so digits and "FCFA" print cleanly on any printer.
 */
function formatPrintCurrency(value: number | string): string {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "0 FCFA";
    const grouped = Math.round(numericValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${grouped} FCFA`;
}

/** "dd/MM/yyyy HH:mm:ss", matching EscPosTicketRenderer.java's TIMESTAMP_FORMAT — kept identical so USB and network tickets read the same. */
function printedAt(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/** Best-effort store logo fetch for the receipt header — mirrors LogoImageLoader.java's role for network jobs. Never throws: a missing/unreachable logo just means no image section, not a failed ticket. */
async function fetchLogoBase64(url: string | null): Promise<string | null> {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = typeof reader.result === "string" ? reader.result : "";
                resolve(result.includes(",") ? result.split(",")[1] : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/** Plain-weight text prints faint on some thermal heads — bold (ESC/POS emphasized mode) lays down more ink and reads noticeably darker, so every ticket text section below defaults to it. */
function darkText(value: string, styles: Parameters<typeof text>[1] = {}): PrintSections {
    return text(value, { bold: true, ...styles });
}

/** Every column in a row prints bold for the same darker-ink reason as {@link darkText}. */
function row(label: string, value: string, charsPerLine = 48): PrintSections {
    const labelWidth = Math.round(charsPerLine * 0.65);
    const valueWidth = charsPerLine - labelWidth;
    return table(2, [[{ text: label, styles: { bold: true } }, { text: value, styles: { bold: true } }]], {
        column_widths: [labelWidth, valueWidth],
    });
}

function renderKitchenTicket(content: KitchenTicketContent): PrintSections[] {
    const sections: PrintSections[] = [
        title("BON CUISINE", { align: "center", bold: true }),
        line("="),
    ];
    if (content.tableName) sections.push(darkText(`Table : ${content.tableName}`));
    if (content.serverName) sections.push(darkText(`Serveur : ${content.serverName}`));
    sections.push(darkText(printedAt()));
    sections.push(line("-"));

    for (const item of content.items) {
        sections.push(darkText(`${item.qty} x ${item.productName}`, { size: "height" }));
        for (const modifier of item.modifierNames) {
            sections.push(darkText(`  + ${modifier}`));
        }
    }

    if (content.note) {
        sections.push(line("-"));
        sections.push(darkText(`Note : ${content.note}`, { italic: true }));
    }

    sections.push(feed(3), cut());
    return sections;
}

async function renderReceipt(content: ReceiptContent, charsPerLine: number): Promise<PrintSections[]> {
    const sections: PrintSections[] = [];
    const logoBase64 = await fetchLogoBase64(content.storeLogoUrl);
    if (logoBase64) {
        sections.push(image(logoBase64, { align: "center" }));
        sections.push(feed(1));
    }
    if (content.storeName) sections.push(title(content.storeName, { align: "center", bold: true }));
    if (content.storeAddress) sections.push(darkText(content.storeAddress, { align: "center" }));
    if (content.storePhone) sections.push(darkText(content.storePhone, { align: "center" }));
    sections.push(darkText(printedAt(), { align: "center" }));
    sections.push(line("="));
    sections.push(darkText(`Réf : ${content.reference}`));
    if (content.tableName) sections.push(darkText(`Table : ${content.tableName}`));
    if (content.serverName) sections.push(darkText(`Serveur : ${content.serverName}`));
    if (content.cashierName) sections.push(darkText(`Caissier : ${content.cashierName}`));
    sections.push(line("-"));

    for (const round of content.rounds) {
        sections.push(subtitle(`--- SERVICE #${round.roundNumber} ---`, { align: "center" }));
        for (const item of round.items) {
            sections.push(row(`${item.qty} x ${item.productName}`, formatPrintCurrency(item.total), charsPerLine));
            for (const modifier of item.modifierNames) {
                sections.push(darkText(`  + ${modifier}`));
            }
        }
    }

    sections.push(line("-"));
    sections.push(row("Sous-total", formatPrintCurrency(content.subtotal), charsPerLine));
    if (content.discount) sections.push(row("Remise", `-${formatPrintCurrency(content.discount)}`, charsPerLine));
    if (content.tax) sections.push(row("Taxe", formatPrintCurrency(content.tax), charsPerLine));
    sections.push(row("TOTAL", formatPrintCurrency(content.total), charsPerLine));
    sections.push(line("-"));
    if (content.paymentMethod) sections.push(darkText(`Paiement : ${content.paymentMethod.toUpperCase()}`));
    if (content.amountReceived != null) sections.push(row("Reçu", formatPrintCurrency(content.amountReceived), charsPerLine));
    if (content.changeDue != null && content.changeDue > 0) sections.push(row("Monnaie", formatPrintCurrency(content.changeDue), charsPerLine));

    if (content.reference) {
        const qrData = JSON.stringify({
            REF: content.reference,
            DATE: printedAt(),
            MNT: formatPrintCurrency(content.total),
            SYS: content.storeName ?? "N/A",
        });
        sections.push(feed(1));
        sections.push(qr(qrData, { align: "center", size: 6, model: 2, error_correction: "L" }));
        sections.push(feed(1));
    }

    // Opens the cash drawer once the receipt is settled — mirrors pulseDrawer() in
    // EscPosTicketRenderer.java, which only network jobs got until now.
    sections.push(drawer(2, 100));

    sections.push(feed(2));
    sections.push(darkText("Merci de votre visite !", { align: "center" }));
    sections.push(feed(3), cut());
    return sections;
}

function renderCoupon(content: CouponContent): PrintSections[] {
    const sections: PrintSections[] = [];
    if (content.storeName) sections.push(title(content.storeName, { align: "center", bold: true }));
    if (content.storeAddress) sections.push(darkText(content.storeAddress, { align: "center" }));
    if (content.storePhone) sections.push(darkText(`Tel : ${content.storePhone}`, { align: "center" }));
    sections.push(darkText(printedAt(), { align: "center" }));
    sections.push(line("="));
    sections.push(darkText("BON DE REDUCTION", { align: "center" }));
    sections.push(feed(1));

    sections.push(title(content.code.toUpperCase(), { align: "center", bold: true }));
    sections.push(feed(1));

    sections.push(darkText(`Valeur : ${formatPrintCurrency(content.amount)}`, { align: "center" }));
    if (content.expiresAt) {
        sections.push(darkText(`Valable jusqu'au ${content.expiresAt.slice(0, 10)}`, { align: "center" }));
    }
    sections.push(line("-"));
    sections.push(darkText("A présenter en caisse lors du règlement.", { align: "center" }));

    sections.push(feed(3), cut());
    return sections;
}

function renderSessionSummary(content: SessionSummaryContent, charsPerLine: number): PrintSections[] {
    const sections: PrintSections[] = [
        title("RECAPITULATIF DE CAISSE", { align: "center", bold: true }),
        line("="),
    ];
    if (content.storeName) sections.push(darkText(content.storeName, { align: "center" }));
    if (content.cashierName) sections.push(darkText(`Caissier : ${content.cashierName}`));
    sections.push(darkText(`Ouverture : ${new Date(content.openedAt).toLocaleString("fr-FR")}`));
    sections.push(darkText(`Fermeture : ${new Date(content.closedAt).toLocaleString("fr-FR")}`));
    sections.push(line("-"));

    sections.push(subtitle("MODES DE REGLEMENTS", { align: "center" }));
    for (const payment of content.paymentBreakdown) {
        sections.push(row(payment.method.toUpperCase(), formatPrintCurrency(payment.total), charsPerLine));
    }
    sections.push(line("-"));

    sections.push(subtitle("ARTICLES VENDUS", { align: "center" }));
    for (const item of content.soldItems) {
        sections.push(row(`${item.qty} x ${item.productName}`, formatPrintCurrency(item.total), charsPerLine));
    }
    sections.push(line("-"));

    sections.push(row("Fonds de caisse", formatPrintCurrency(content.openingAmount), charsPerLine));
    sections.push(row("Total ventes", formatPrintCurrency(content.totalSales), charsPerLine));
    sections.push(row("Attendu", formatPrintCurrency(content.expectedAmount), charsPerLine));
    sections.push(row("Compté", formatPrintCurrency(content.actualAmount), charsPerLine));
    sections.push(row("Écart", formatPrintCurrency(content.difference), charsPerLine));

    sections.push(darkText(printedAt(), { align: "center" }));
    sections.push(feed(3), cut());
    return sections;
}
