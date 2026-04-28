import { invoke, isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';

export const usePrint = () => {


  /**
   * Imprime un ticket de caisse (Client)
   */
  const printReceipt = async (order: any) => {
    if (!isTauri()) {
      console.log("Simulation impression ticket client:", order);
      return;
    }

    try {
      // 'print_order' est une commande Rust définie dans src-tauri/src/main.rs
      await invoke('print_order', { 
        payload: {
          reference: order.reference,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          customer_name: order.customer?.name || 'Client Passant',
          cashier_name: order.user?.name,
          date: new Date().toLocaleString(),
        }
      });
    } catch (error) {
   /*    toast({
        title: "Erreur d'impression",
        description: "Impossible de joindre l'imprimante de caisse.",
        variant: "destructive",
      }); */
    }
  };

  /**
   * Imprime un bon de préparation (Cuisine)
   */
  const printKitchenTicket = async (items: any[], stationName: string) => {
    if (!isTauri()) {
      console.log(`Simulation bon cuisine (${stationName}):`, items);
      return;
    }

    try {
      await invoke('print_kitchen_item', { 
        payload: {
          station: stationName,
          items: items.map(item => ({
            name: item.name,
            qty: item.qty,
            note: item.note || '',
            modifiers: item.modifiers?.map((m: any) => m.name) || [],
          })),
          timestamp: new Date().toLocaleTimeString(),
        }
      });
    } catch (error) {
      console.error("Erreur impression cuisine:", error);
    }
  };

  return { printReceipt, printKitchenTicket };
};