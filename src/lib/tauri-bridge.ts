import { invoke } from '@tauri-apps/api/core';

/**
 * Vérifie si l'application s'exécute dans l'environnement Tauri.
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * GESTION DE L'IMPRESSION (ESC/POS)
 * Envoie les données de la commande à la fonction native Rust.
 */
export const printOrderReceipt = async (order: any, printerConfig: any) => {
  if (!isTauri()) {
    console.warn("Impression simulée (Web) :", order);
    return { success: true, message: "Simulated on web" };
  }

  try {
    // 'print_thermal_receipt' est une fonction définie dans src-tauri/src/main.rs
    return await invoke('print_thermal_receipt', { 
      data: order,
      config: printerConfig 
    });
  } catch (error) {
    console.error("Erreur d'impression native :", error);
    throw error;
  }
};

/**
 * SYNC LOGS & STOCK (SQLite Local ou File System)
 * Permet de sauvegarder une commande localement si le backend Laravel est injoignable.
 */
export const saveOfflineOrder = async (order: any) => {
  if (!isTauri()) {
    localStorage.setItem(`offline_order_${Date.now()}`, JSON.stringify(order));
    return;
  }

  try {
    return await invoke('save_to_local_db', { payload: order });
  } catch (error) {
    console.error("Erreur sauvegarde locale Tauri :", error);
  }
};

/**
 * SYSTÈME / NOTIFICATIONS NATIVES
 */
export const sendNativeNotification = async (title: string, body: string) => {
  if (isTauri()) {
    const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
    
    let permission = await isPermissionGranted();
    if (!permission) {
      permission = await requestPermission() === 'granted';
    }
    
    if (permission) {
      sendNotification({ title, body });
    }
  } else {
    alert(`${title}: ${body}`);
  }
};