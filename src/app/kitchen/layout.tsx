import { RouteGuard } from "@/components/shared/RouteGuard";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  // Auth-only, no role restriction — matches the backend's own rule for /api/kitchen/**
  // (`anyRequest().authenticated()`, no hasAnyRole), not stricter than the API allows.
  return <RouteGuard>{children}</RouteGuard>;
}
