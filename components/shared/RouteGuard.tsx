"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/src/store/use-auth-store';
import { AppRole, roleHomeRoute } from '@/src/constants/roles';

interface RouteGuardProps {
  children: React.ReactNode;
  /** Omit to require only authentication (any role) — matches the backend's own rule for /api/pos/** and /api/kitchen/**, which aren't role-restricted either. */
  allowedRoles?: AppRole[];
}

/**
 * Client-side route gate for /admin, /kitchen and /pos — the static export
 * (`output: 'export'` in next.config, since the Tauri build has no server
 * runtime) can't use Next.js middleware, so this replaces it at the layout
 * level. Before this, every one of these sections rendered its full UI to
 * anyone, authenticated or not, until the first API call happened to 401 —
 * see the security audit's "aucune page admin/cuisine/caisse n'est
 * réellement protégée côté client" finding.
 *
 * Waits for the persisted auth store to rehydrate before deciding anything
 * (see `hasHydrated` in `use-auth-store.ts`), so a legitimately logged-in
 * user reloading the page never flashes a redirect to /login.
 */
export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  const roleAllowed = !allowedRoles || (!!role && allowedRoles.includes(role));

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!roleAllowed) {
      router.replace(roleHomeRoute(role));
    }
  }, [hasHydrated, isAuthenticated, roleAllowed, role, router]);

  if (!hasHydrated || !isAuthenticated || !roleAllowed) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
