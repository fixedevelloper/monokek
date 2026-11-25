"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ADMIN_ROLES, ROLES, STOCK_PATHS, STOCK_PERMISSIONS, roleHomeRoute } from "@/src/constants/roles";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useAuth } from "@/src/hooks/use-auth";
import { canAccessAdminRoute } from "@/src/constants/admin-access";
import { AccessDenied } from "@/components/shared/AccessDenied";

/**
 * Un employé qui n'est ni admin ni manager (magasinier, caissier, cuisinier…) n'entre dans l'administration que s'il détient une permission de
 * stock, et ne voit alors que les écrans de stock, fournisseurs et transferts : le serveur lui refuse de toute façon le reste. Sans aucune
 * permission de stock, un magasinier voit un refus (le renvoyer vers son accueil le ferait boucler), les autres rôles retournent à leur accueil.
 */
function StockScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, can } = useAuth();
  const isAdminArea = !user || ADMIN_ROLES.includes(user.role);
  const hasStock = STOCK_PERMISSIONS.some((p) => can(p));
  const inStockPaths = STOCK_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const firstAllowed = STOCK_PATHS.find((p) => canAccessAdminRoute(p, can));

  const redirectTo = isAdminArea ? null : !hasStock ? (user?.role === ROLES.WAREHOUSE ? null : roleHomeRoute(user?.role)) : !inStockPaths ? (firstAllowed ?? null) : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isAdminArea) return <>{children}</>;
  if (!hasStock && user?.role === ROLES.WAREHOUSE) return <AccessDenied />;
  return redirectTo || !hasStock ? null : <>{children}</>;
}

/**
 * Un manager n'ouvre que les pages dont il détient la permission, même en saisissant l'adresse à la main : le serveur
 * le refuserait de toute façon (403), autant afficher une explication plutôt qu'une page qui ne charge rien.
 * L'admin passe toujours ; les employés « stock » sont déjà confinés par {@link StockScope}.
 */
function PermissionScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const allowed = !user || canAccessAdminRoute(pathname, can);
  return allowed ? <>{children}</> : <AccessDenied />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <StockScope>
        <PermissionScope>{children}</PermissionScope>
      </StockScope>
    </RouteGuard>
  );
}
