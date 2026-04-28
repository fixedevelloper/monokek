import { create } from 'zustand';

interface UIState {
  // Sidebar & Navigation
  isSidebarOpen: boolean;
  activeModule: 'sales' | 'tables' | 'kitchen' | 'inventory' | 'reports';
  
  // Modals & Overlays
  isPaymentModalOpen: boolean;
  selectedSaleForPayment: any | null;
  isModifierModalOpen: boolean;
  isLocked: boolean; // État de verrouillage de l'écran (PIN Code)
  
  // UI Settings (Tauri specific)
  isDarkMode: boolean;
  isCompactMode: boolean; // Pour les petits écrans/tablettes

  // Actions
  toggleSidebar: () => void;
  setModule: (module: UIState['activeModule']) => void;
  openPayment: (sale?: any) => void; // <-- MODIFIÉ : Accepte maintenant une vente
  closePayment: () => void;
  setLocked: (status: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Default State
  isSidebarOpen: true,
  activeModule: 'sales',
  isPaymentModalOpen: false,
  isModifierModalOpen: false,
  isLocked: false,
  isDarkMode: true,
  isCompactMode: false,

  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setModule: (module) => set({ activeModule: module }),
  
  selectedSaleForPayment: null,

  // On ouvre le modal et on injecte les données de la vente d'un coup
  openPayment: (sale) => set({ 
    isPaymentModalOpen: true, 
    selectedSaleForPayment: sale || null 
  }),
  
  closePayment: () => set({ 
    isPaymentModalOpen: false, 
    selectedSaleForPayment: null 
  }),
  
  
  setLocked: (status) => set({ isLocked: status }),
  
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));