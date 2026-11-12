"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ADMIN_AREA_ROLES, ROLES, WAREHOUSE_PATHS } from "@/src/constants/roles";
import { useAuthStore } from "@/src/store/use-auth-store";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={ADMIN_AREA_ROLES}>
      <WarehouseScope>{children}</WarehouseScope>
    </RouteGuard>
  );
}
