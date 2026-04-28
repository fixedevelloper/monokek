import { invoke } from "@tauri-apps/api/core";

export interface TicketItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptPayload {
  printerName: string;
  businessName: string;
  cashier: string;
  items: TicketItem[];
  total: number;
}

export async function printReceipt(data: ReceiptPayload) {
  return await invoke("print_receipt", { payload: data });
}