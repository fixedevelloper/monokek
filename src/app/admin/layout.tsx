"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ADMIN_AREA_ROLES, ROLES, WAREHOUSE_PATHS } from "@/src/constants/roles";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useAuth } from "@/src/hooks/use-auth";
import { canAccessAdminRoute } from "@/src/constants/admin-access";
import { AccessDenied } from "@/components/shared/AccessDenied";

/**
 * Le magasinier entre dans l'administration mais ne voit que le stock, les fournisseurs et les transferts : le serveur lui refuse de toute façon
 * le reste, ce garde-fou lui évite d'arriver sur des pages qui ne chargeraient rien.
 */
function WarehouseScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const allowed = role !== ROLES.WAREHOUSE || WAREHOUSE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!allowed) router.replace(WAREHOUSE_PATHS[0]);
  }, [allowed, router]);

  return allowed ? <>{children}</> : null;
}

/**
 * Un manager n'ouvre que les pages dont il détient la permission, même en saisissant l'adresse à la main : le serveur
 * le refuserait de toute façon (403), autant afficher une explication plutôt qu'une page qui ne charge rien.
 * L'admin passe toujours ; le magasinier est déjà confiné par {@link WarehouseScope}.
 */
function PermissionScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const allowed = !user || user.role === ROLES.WAREHOUSE || canAccessAdminRoute(pathname, can);
  return allowed ? <>{children}</> : <AccessDenied />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={ADMIN_AREA_ROLES}>
      <WarehouseScope>
        <PermissionScope>{children}</PermissionScope>
      </WarehouseScope>
    </RouteGuard>
  );
}
