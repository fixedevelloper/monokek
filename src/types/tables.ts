export interface Floor {
    id: number;
    name: string;
    tables: Table[]
}
export interface Table {
    id: number;
    name: string;
    // Valeurs réellement supportées côté Spring (floorplan.TableController) : pas de 'reserved'.
    status: 'free' | 'occupied' | 'billing' | 'maintenance';
    seats: number;
    total?: number; // Venant d'une jointure ou d'un calcul backend
    time?: string;
    // Table de secours d'une branche (walk-in sans table) : jamais occupée, jamais de commande réutilisée.
    virtual?: boolean;
}
export interface KitchenTicket {
  id: number;
  reference: string;
  table: string;
  /** Cuisine centrale : succursale d'où vient la commande. Absent pour les commandes de la cuisine elle-même. */
  originBranchId?: number | null;
  originBranchName?: string | null;
  status: 'pending' | 'preparing' | 'ready';
  createdAt: string;
  items: Array<{
    id: number;
    name: string;
    qty: number;
    modifiers: Array<{ name: string; quantity: number }>;
  }>;
}