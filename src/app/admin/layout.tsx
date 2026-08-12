import { RouteGuard } from "@/components/shared/RouteGuard";
import { ADMIN_ROLES } from "@/src/constants/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={ADMIN_ROLES}>{children}</RouteGuard>;
}
