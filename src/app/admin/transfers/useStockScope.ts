"use client";

import { useQuery } from "@tanstack/react-query";
import * as stockApi from "@/src/lib/api/stock";

/**
 * Ce que le compte connecté peut faire en stock, déduit des lieux qu'il atteint (pas besoin de connaître sa succursale) :
 * `owner` (plusieurs lieux), `warehouse` (l'entrepôt seul) ou `branch` (le lieu de sa succursale).
 */
export function useStockScope() {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["stock-locations"],
    queryFn: stockApi.listStockLocations,
    staleTime: 60_000,
  });
  const scope = stockApi.stockScopeOf(locations);
  return {
    isLoading,
    locations,
    scope,
    /** Le lieu de ma succursale (compte de succursale uniquement). */
    myLocation: scope === "branch" ? locations[0] : undefined,
    warehouse: locations.find((l) => l.kind === "WAREHOUSE"),
    /** Peut approuver et expédier (propriétaire ou magasinier). */
    isSupplier: scope === "owner" || scope === "warehouse",
  };
}
