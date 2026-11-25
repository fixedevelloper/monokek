
/**
 * Noms des rôles tels que définis dans la table 'roles' (Migration Laravel)
 */
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  MANAGER: 'manager',
  /** Magasinier de l'entrepôt général : stock, fournisseurs, achats et transferts uniquement. */
  WAREHOUSE: 'warehouse',
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

/** Roles allowed into `/admin/**` — mirrors the backend's own `hasAnyRole("ADMIN", "MANAGER")` rule for `/api/admin/**`. */
export const ADMIN_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.MANAGER];

/** Rôles qui entrent dans `/admin/**` : les administrateurs, et le magasinier — mais celui-ci seulement dans {@link WAREHOUSE_PATHS}. */
export const ADMIN_AREA_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE];

/** Les seules pages d'administration que le magasinier atteint (le serveur lui refuse de toute façon le reste). */
export const WAREHOUSE_PATHS = ['/admin/transfers', '/admin/stock', '/admin/suppliers'];

/**
 * Where a role lands after login, and where `RouteGuard` sends a user caught
 * on a screen their role isn't allowed into. Single source of truth shared
 * by `src/app/page.tsx` (post-login dispatch) and every `RouteGuard` usage,
 * so both always agree on "home" for a given role.
 */
export function roleHomeRoute(role?: AppRole | string | null): string {
  switch (role) {
    case ROLES.ADMIN:
    case ROLES.MANAGER:
      return '/admin';
    case ROLES.WAREHOUSE:
      return '/admin/transfers';
    case ROLES.KITCHEN:
      return '/kitchen/tickets';
    case ROLES.CASHIER:
      return '/pos/sales';
    case ROLES.WAITER:
      return '/pos/tables';
    default:
      return '/pos/tables';
  }
}

/**
 * Mapping des permissions pour l'UI. Doit correspondre exactement au
 * catalogue seedé en base (monokek-spring V2__seed_rbac.sql) — ce sont les
 * noms bruts renvoyés par `/api/admin/staff/permissions/list` et portés par
 * le claim `permissions` du JWT (voir `use-auth-store.ts#hasPermission`).
 */
export const PERMISSIONS = {
  // Staff
  MANAGE_USERS: 'manage_users',
  VIEW_STAFF: 'view_staff',
  EDIT_PERMISSIONS: 'edit_permissions',

  // Commandes
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  CANCEL_ORDERS: 'cancel_orders',
  VIEW_HISTORY: 'view_history',

  // Produits
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_STOCK: 'manage_stock',
  MANAGE_CATEGORIES: 'manage_categories',

  // Rapports
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',

  // Finance
  CLOSE_CASHIER: 'close_cashier',
  MANAGE_DISCOUNTS: 'manage_discounts',

  // Réglages
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BRANCH: 'manage_branch',

  // Administration fine (migration V36) : avant, tout manager y accédait par son seul rôle.
  MANAGE_DEVICES: 'manage_devices',
  VIEW_ACTIVITY_LOG: 'view_activity_log',
  MANAGE_CUSTOMERS: 'manage_customers',
  MANAGE_FLOOR: 'manage_floor',
  MANAGE_COMMISSIONS: 'manage_commissions',
  MANAGE_RESERVATIONS: 'manage_reservations',
  MANAGE_KITCHEN: 'manage_kitchen',
  MANAGE_STAFFING: 'manage_staffing',
} as const;

/** Libellé français et rubrique de chaque permission, pour l'écran des droits (le serveur ne renvoie qu'un nom brut). */
export const PERMISSION_META: Record<string, { label: string; group: string }> = {
  manage_users: { label: 'Gérer les comptes du personnel', group: 'Personnel' },
  view_staff: { label: 'Voir le personnel', group: 'Personnel' },
  edit_permissions: { label: 'Modifier les permissions', group: 'Personnel' },
  manage_staffing: { label: 'Planning et pointage', group: 'Personnel' },
  create_orders: { label: 'Créer des commandes', group: 'Commandes' },
  edit_orders: { label: 'Modifier des commandes', group: 'Commandes' },
  cancel_orders: { label: 'Annuler des commandes', group: 'Commandes' },
  view_history: { label: "Consulter l'historique des commandes", group: 'Commandes' },
  manage_reservations: { label: 'Gérer les réservations', group: 'Commandes' },
  manage_products: { label: 'Gérer les produits et recettes', group: 'Catalogue & stock' },
  manage_categories: { label: 'Gérer les catégories', group: 'Catalogue & stock' },
  manage_stock: { label: 'Gérer le stock', group: 'Catalogue & stock' },
  manage_discounts: { label: 'Gérer les remises et coupons', group: 'Catalogue & stock' },
  manage_customers: { label: 'Gérer les clients et la fidélité', group: 'Clients' },
  view_reports: { label: 'Voir les rapports et la comptabilité', group: 'Rapports' },
  view_analytics: { label: 'Voir les statistiques', group: 'Rapports' },
  manage_commissions: { label: 'Régler les commissions', group: 'Rapports' },
  view_activity_log: { label: "Voir le journal d'activité", group: 'Rapports' },
  close_cashier: { label: 'Clôturer la caisse (non appliquée)', group: 'Finance' },
  manage_floor: { label: 'Gérer le plan de salle et les tables', group: 'Salle & cuisine' },
  manage_kitchen: { label: 'Gérer les stations de cuisine', group: 'Salle & cuisine' },
  manage_devices: { label: 'Imprimantes, postes et caisses', group: 'Configuration' },
  manage_settings: { label: 'Réglages généraux', group: 'Configuration' },
  manage_branch: { label: 'Sociétés et succursales', group: 'Configuration' },
};

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