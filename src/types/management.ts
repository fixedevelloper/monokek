/**
 * Types pour la gestion du personnel - Mono-Kek
 */

export type StaffRole = 'admin' | 'manager' | 'caissier' | 'serveur' | 'cuisinier';

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
    branch_id: number;
    is_active: boolean;
    
    // Le rôle principal retourné par UserResource via Spatie
    role: StaffRole;
    
    // Liste des permissions pour le contrôle d'accès granulaire (facultatif)
    permissions?: Permission[];
    
    created_at: string; // Formaté par Laravel (ex: "25/04/2026 08:30")
    updated_at: string;
}

/**
 * Interface pour la création d'un nouveau membre (Request)
 */
export interface CreateStaffRequest {
    name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    password: string;
    password_confirmation: string;
}

/**
 * Interface pour la mise à jour (Request)
 */
export interface UpdateStaffRequest {
    name?: string;
    email?: string;
    phone?: string;
    role?: StaffRole;
    is_active?: boolean;
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
    caissier: { 
        label: 'Caissier', 
        color: 'bg-blue-500/10 text-blue-600 border-blue-200' 
    },
    serveur: { 
        label: 'Serveur', 
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' 
    },
    cuisinier: { 
        label: 'Cuisinier', 
        color: 'bg-orange-500/10 text-orange-600 border-orange-200' 
    }
};