import { PERMISSIONS, STOCK_PERMISSIONS } from '@/src/constants/roles';

/**
 * Pages d'administration → permission(s) requise(s). Une seule source de vérité : le tableau de bord s'en sert
 * pour masquer les cartes, et le layout admin pour refuser l'accès à une adresse saisie à la main. Miroir des
 * `@PreAuthorize` du serveur (le serveur reste l'autorité : ceci évite seulement des pages vides et des 403).
 *
 * `anyOf` : une seule de ces permissions suffit. Absent de la liste = ouvert à tout administrateur/manager.
 * L'admin passe toujours (voir `hasPermission`). Le plus long préfixe l'emporte.
 */
export const ADMIN_ROUTE_ACCESS: ReadonlyArray<{ prefix: string; anyOf: string[] }> = [
  { prefix: '/admin/menu', anyOf: [PERMISSIONS.MANAGE_PRODUCTS] },
  { prefix: '/admin/tables', anyOf: [PERMISSIONS.MANAGE_FLOOR] },
  { prefix: '/admin/floors', anyOf: [PERMISSIONS.MANAGE_FLOOR] },
  { prefix: '/admin/reports', anyOf: [PERMISSIONS.VIEW_REPORTS] },
  { prefix: '/admin/accounting', anyOf: [PERMISSIONS.VIEW_REPORTS] },
  { prefix: '/admin/staff', anyOf: [PERMISSIONS.VIEW_STAFF] },
  { prefix: '/admin/planning', anyOf: [PERMISSIONS.MANAGE_STAFFING] },
  { prefix: '/admin/reservations', anyOf: [PERMISSIONS.MANAGE_RESERVATIONS] },
  { prefix: '/admin/crm', anyOf: [PERMISSIONS.MANAGE_CUSTOMERS] },
  { prefix: '/admin/commissions', anyOf: [PERMISSIONS.MANAGE_COMMISSIONS, PERMISSIONS.VIEW_ANALYTICS] },
  { prefix: '/admin/history', anyOf: [PERMISSIONS.VIEW_HISTORY] },
  // Stock : n'importe quelle permission de stock ouvre ces écrans ; chaque action y est ensuite filtrée par sa propre permission.
  { prefix: '/admin/stock', anyOf: [...STOCK_PERMISSIONS, PERMISSIONS.MANAGE_STOCK] },
  { prefix: '/admin/transfers', anyOf: STOCK_PERMISSIONS },
  { prefix: '/admin/suppliers', anyOf: STOCK_PERMISSIONS },
  // Réglages : la page réunit imprimantes/caisses (devices), stations (kitchen) et réglages généraux.
  { prefix: '/admin/settings', anyOf: [PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_DEVICES, PERMISSIONS.MANAGE_KITCHEN] },
  { prefix: '/admin/company', anyOf: [PERMISSIONS.MANAGE_BRANCH] },
  { prefix: '/admin/activity', anyOf: [PERMISSIONS.VIEW_ACTIVITY_LOG] },
];

/** Permissions dont l'une suffit pour cette page, ou `null` si elle n'en exige aucune. */
export function requiredPermissionsFor(pathname: string): string[] | null {
  const hit = ADMIN_ROUTE_ACCESS
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return hit ? hit.anyOf : null;
}

export function canAccessAdminRoute(pathname: string, can: (permission: string) => boolean): boolean {
  const needed = requiredPermissionsFor(pathname);
  return !needed || needed.some((p) => can(p));
}
