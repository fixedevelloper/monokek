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
    /** Nom de la succursale qui possède la station (utile pour reconnaître une cuisine centrale). */
    branchName?: string | null;
}

/** Libellé d'une station dans un sélecteur : le nom de sa succursale n'est ajouté que si ce n'est pas celle de la catégorie. */
export function stationLabel(station: KitchenStation, categoryBranchId?: number | null): string {
    const base = `${station.name} (${STATION_TYPE_LABELS[station.type]})`;
    return station.branchName && categoryBranchId != null && station.branchId !== categoryBranchId
        ? `${base} — ${station.branchName}`
        : base;
}
