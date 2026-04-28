import { invoke, isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';

export const usePrint = () => {

  /**
   * Imprime un ticket de caisse (Client)
   */
  const printReceipt = async (order: any) => {
    if (!isTauri()) {
      console.log("🖥️ Simulation impression ticket client:", order);
      toast.info("Mode Navigateur : Impression simulée en console.");
      return;
    }

    // On lance un toast de chargement
    const toastId = toast.loading("Impression du ticket client...");

    try {
      await invoke('print_order', { 
        payload: {
          reference: order.reference,
          items: order.items.map((i: any) => ({
            name: i.name,
            price: i.price,
            qty: i.quantity || i.qty
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          customer_name: order.customer?.name || 'Client Passant',
          cashier_name: order.user?.name || 'Système',
          date: new Date().toLocaleString('fr-FR'),
        }
      });
      
      toast.success("Ticket imprimé avec succès", { id: toastId });
    } catch (error) {
      console.error("Print Error:", error);
      toast.error("Erreur d'impression : Vérifiez la connexion de l'imprimante.", { id: toastId }); 
    }
  };

  /**
   * Imprime un bon de préparation (Cuisine)
   */
  const printKitchenTicket = async (items: any[], stationName: string) => {
    if (!isTauri()) {
      console.log(`👨‍🍳 Simulation bon cuisine (${stationName}):`, items);
      return;
    }

    try {
      await invoke('print_kitchen_item', { 
        payload: {
          station: stationName,
          items: items.map(item => ({
            name: item.name,
            qty: item.qty || item.quantity,
            note: item.note || '',
            modifiers: item.modifiers?.map((m: any) => m.name) || [],
          })),
          timestamp: new Date().toLocaleTimeString('fr-FR'),
        }
      });
      toast.success(`Bon envoyé en ${stationName}`);
    } catch (error) {
      console.error("Kitchen Print Error:", error);
      toast.error(`Échec de l'envoi en ${stationName}`);
    }
  };

  return { printReceipt, printKitchenTicket };
};