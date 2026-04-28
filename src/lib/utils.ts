import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}




 export function formatStock(qty: number, unit: string = "pcs"): string {
  return `${Number(qty).toLocaleString("fr-FR")} ${unit}`;
}


 export function getStatusDetails(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return { label: "En attente", color: "bg-yellow-500", text: "text-yellow-900" };
    case "ready":
      return { label: "Prêt", color: "bg-green-500", text: "text-white" };
    case "delivered":
      return { label: "Servi", color: "bg-blue-500", text: "text-white" };
    case "cancelled":
      return { label: "Annulé", color: "bg-red-500", text: "text-white" };
    default:
      return { label: status, color: "bg-gray-500", text: "text-white" };
  }
}


 function calculateOrderTotal(subtotal: number, tax: number, discount: number): number {
  return subtotal + tax - discount;
}

 function truncate(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}