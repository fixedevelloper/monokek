export interface Floor {
    id: number;
    name: string;
    tables: Table[]
}
export interface Table {
    id: number;
    name: string;
    status: 'free' | 'occupied' | 'billing' | 'reserved';
    seats: number;
    total?: number; // Venant d'une jointure ou d'un calcul backend
    time?: string;
}
export interface KitchenTicket {
  id: number;
  reference: string;
  table: string;
  status: 'pending' | 'preparing' | 'ready';
  createdAt: string;
  items: any[];
}