export const STATION_TYPES = ['KITCHEN', 'BAR', 'GRILL', 'PASTRY', 'OTHER'] as const;
export type StationType = typeof STATION_TYPES[number];

export const STATION_TYPE_LABELS: Record<StationType, string> = {
    KITCHEN: 'Cuisine',
    BAR: 'Bar',
    GRILL: 'Grill',
    PASTRY: 'Pâtisserie',
    OTHER: 'Autre',
};

export interface KitchenStation {
    id: number;
    branchId: number;
    name: string;
    type: StationType;
    pendingTicketsCount: number;
}
