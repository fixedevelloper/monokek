/**
 * Noms des rôles tels que définis dans la table 'roles' (Migration Laravel)
 */
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  MANAGER: 'manager',
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

/**
 * Mapping des permissions pour l'UI (Optionnel mais recommandé)
 * Permet de lier des fonctionnalités à des permissions précises
 */
export const PERMISSIONS = {
  // Commandes
  CREATE_ORDER: 'create_order',
  DELETE_ORDER: 'delete_order',
  CANCEL_ORDER: 'cancel_order',
  APPLY_DISCOUNT: 'apply_discount',
  
  // Caisse
  OPEN_CASH_SESSION: 'open_cash_session',
  CLOSE_CASH_SESSION: 'close_cash_session',
  MANAGE_PAYMENTS: 'manage_payments',
  
  // Stock & Admin
  MANAGE_INVENTORY: 'manage_inventory',
  VIEW_REPORTS: 'view_reports',
  MANAGE_STAFF: 'manage_staff',
  EDIT_SETTINGS: 'edit_settings',
} as const;

/**
 * Couleurs thématiques par rôle pour l'interface
 * Pour un design "puissant" qui aide le staff à s'identifier
 */
export const ROLE_THEMES = {
  [ROLES.ADMIN]: {
    color: '#8b5cf6', // Violet
    label: 'Administrateur',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500',
  },
    [ROLES.MANAGER]: {
    color: '#8b5cf6', // Violet
    label: 'Administrateur',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500',
  },
  [ROLES.CASHIER]: {
    color: '#10b981', // Vert
    label: 'Caissier',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500',
  },
  [ROLES.WAITER]: {
    color: '#3b82f6', // Bleu
    label: 'Serveur',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
  },
  [ROLES.KITCHEN]: {
    color: '#f59e0b', // Orange
    label: 'Cuisine',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
  },
} as const;