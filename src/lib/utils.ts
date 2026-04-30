import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCleanHost = (input: string): string => {
    if (!input) return "127.0.0.1";
    
    // Supprime le protocole (http:// ou https://)
    let host = input.replace(/(^\w+:|^)\/\//, '');
    
    // Supprime le port s'il existe (ex: api.mono-kek.com:8000 -> api.mono-kek.com)
    host = host.split(':')[0];
    
    // Supprime les slashes de fin
    host = host.split('/')[0];
    
    return host;
};


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


/**
 * Date complète pour les rapports (ex: 30 Avril 2026)
 */
export const formatDateLong = (date: string | Date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
};

/**
 * Date relative pour les tickets cuisine (ex: "Il y a 2 min")
 */
export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: fr 
  });
};