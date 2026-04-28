import { invoke } from '@tauri-apps/api/core';

/**
 * Vérifie si l'application s'exécute dans l'environnement Tauri.
 * Version plus robuste pour Tauri v2
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

/**
 * GESTION DE L'IMPRESSION (ESC/POS)
 */
export const printOrderReceipt = async (order: any, printerConfig: any) => {
  if (!isTauri()) {
    console.warn("🖨️ Impression simulée (Web) :", order);
    return { success: true, message: "Simulated on web" };
  }

  try {
    // Note : On passe souvent un 'payload' structuré pour correspondre au Deserialize de Rust
    return await invoke('print_thermal_receipt', { 
      payload: {
        order,
        config: printerConfig 
      }
    });
  } catch (error) {
    console.error("❌ Erreur d'impression native :", error);
    throw error;
  }
};

/**
 * SAUVEGARDE HORS-LIGNE
 */
export const saveOfflineOrder = async (order: any) => {
  if (!isTauri()) {
    const key = `offline_order_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(order));
    console.info("💾 Commande sauvegardée dans le LocalStorage (Web)");
    return;
  }

  try {
    // 'save_to_local_db' doit être enregistré dans src-tauri/src/lib.rs ou main.rs
    return await invoke('save_to_local_db', { payload: order });
  } catch (error) {
    console.error("❌ Erreur sauvegarde locale Tauri :", error);
    throw error;
  }
};

/**
 * SYSTÈME / NOTIFICATIONS NATIVES
 * Optimisé pour ne pas re-importer le plugin à chaque appel
 */
export const sendNativeNotification = async (title: string, body: string) => {
  if (!isTauri()) {
    console.info(`🔔 Notification Web: ${title} - ${body}`);
    return;
  }

  try {
    // Importation dynamique du plugin notification
    const { 
      isPermissionGranted, 
      requestPermission, 
      sendNotification 
    } = await import('@tauri-apps/plugin-notification');
    
    let permission = await isPermissionGranted();
    if (!permission) {
      const permissionResponse = await requestPermission();
      permission = permissionResponse === 'granted';
    }
    
    if (permission) {
      sendNotification({ title, body, icon: 'info-icon' });
    }
  } catch (error) {
    console.error("❌ Erreur notification native :", error);
  }
};