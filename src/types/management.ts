/**
 * Types pour la gestion du personnel - Mono-Kek
 */

// Doit matcher les noms de rôle réels renvoyés par monokek-spring (StaffDto.role,
// voir V2__seed_rbac.sql) — PAS des libellés français : ROLE_CONFIG ci-dessous
// s'en charge pour l'affichage.
export type StaffRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export interface Permission {
    id: number;
    name: string;
    label: string;
}
export interface StaffMember {
    id: number;
    uuid: string; // Utilisé pour les routes API
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;

    // Le rôle principal retourné par UserResource via Spatie
    role: StaffRole;

    // Liste des noms de permission direct (hors rôle) pour le contrôle d'accès granulaire
    permissions?: string[];

    created_at: string; // Formaté par Laravel (ex: "25/04/2026 08:30")
    updated_at: string;

    // null = aucune branche assignée (owner/super-admin) — voit toutes les branches
    branch_id: number | null;
}

/**
 * Utilitaires pour l'affichage des rôles (UI)
 */
export const ROLE_CONFIG: Record<StaffRole, { label: string; color: string }> = {
    admin: {
        label: 'Administrateur',
        color: 'bg-red-500/10 text-red-600 border-red-200'
    },
    manager: {
        label: 'Manager',
        color: 'bg-purple-500/10 text-purple-600 border-purple-200'
    },
    cashier: {
        label: 'Caissier',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    waiter: {
        label: 'Serveur',
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    },
    kitchen: {
        label: 'Cuisinier',
        color: 'bg-orange-500/10 text-orange-600 border-orange-200'
    }
};