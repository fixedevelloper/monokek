"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Minus, Plus, Scale, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as stockApi from "@/src/lib/api/stock";
import type { StockProductRow } from "@/src/lib/api/stock";
import { getErrorMessage } from "@/src/lib/errors";
import { cn } from "@/src/lib/utils";
import { useStockScope } from "../transfers/useStockScope";

type Mode = "place" | "all";
type Movement = "in" | "out" | "adjust";

const MOVEMENT_LABELS: Record<Movement, string> = { in: "Entrée", out: "Sortie", adjust: "Comptage (nouveau total)" };

/**
 * Stock des PRODUITS, lieu par lieu : chaque succursale a son compte, l'entrepôt aussi. Le propriétaire choisit le lieu et dispose d'une vue
 * consolidée ; un compte de succursale voit le sien ; un magasinier consulte l'entrepôt (il le fait bouger par les achats et les transferts).
 */
export function ProductStockPanel() {
  const queryClient = useQueryClient();
  const { locations, scope, isLoading: scopeLoading } = useStockScope();
  const [chosen, setChosen] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("place");
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<{ product: StockProductRow; type: Movement } | null>(null);

  const placeId = chosen ?? locations.find((l) => l.kind === "WAREHOUSE")?.id ?? locations[0]?.id;
  const canAdjust = scope !== "warehouse";   // un magasinier n'a pas accès aux produits : ses mouvements passent par achats et transferts

  const { data: items, isLoading } = useQuery({
    queryKey: ["stock-items", placeId],
    queryFn: () => stockApi.listStockItems(placeId),
    enabled: placeId !== undefined && mode === "place",
  });

  const rows = useMemo(
    () => (items?.products ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  if (scopeLoading) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border flex flex-wrap gap-4 items-center">
        {scope === "owner" && locations.length > 1 && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="rounded-full">
              <TabsTrigger value="place" className="rounded-full text-[11px] font-black uppercase">Un lieu</TabsTrigger>
              <TabsTrigger value="all" className="rounded-full text-[11px] font-black uppercase">Vue consolidée</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {mode === "place" && (
          <>
            {scope === "owner" && (
              <Select value={placeId !== undefined ? String(placeId) : ""} onValueChange={(v) => setChosen(Number(v))}>
                <SelectTrigger className="h-12 w-64 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Lieu" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {locations.map((l) => <SelectItem key={l.id} value={String(l.id)} className="font-bold">{l.kind === "WAREHOUSE" ? "🏭 " : ""}{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {scope !== "owner" && <p className="font-black uppercase tracking-tight text-slate-700">{items?.locationName ?? ""}</p>}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Rechercher un produit…" className="pl-12 h-12 rounded-xl border-none bg-slate-50" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {mode === "all" ? (
        <ConsolidatedTable />
      ) : isLoading ? (
        <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
      ) : rows.length === 0 ? (
        <p className="text-slate-500 py-12 text-center">Aucun produit en stock suivi dans ce lieu.</p>
      ) : (
        <div className="bg-white rounded-[2rem] border shadow-sm divide-y overflow-hidden">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-slate-800 truncate">{p.name}</p>
                <p className="text-[11px] uppercase tracking-widest text-slate-400">{p.sku ? `Réf. ${p.sku} · ` : ""}Alerte à {p.alertQty}</p>
              </div>
              {p.isLowStock && p.alertQty > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-500 text-white text-[10px] font-black px-3 py-1"><AlertCircle size={12} /> STOCK BAS</span>
              )}
              <span className={cn("text-3xl font-black italic tabular-nums w-20 text-right", p.isLowStock && p.alertQty > 0 ? "text-red-600" : "text-slate-900")}>{p.qty}</span>
              {canAdjust && (
                <div className="flex gap-2">
                  <Button size="icon" className="rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" onClick={() => setAdjusting({ product: p, type: "in" })}><Plus size={18} /></Button>
                  <Button size="icon" className="rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white" onClick={() => setAdjusting({ product: p, type: "out" })}><Minus size={18} /></Button>
                  <Button size="icon" variant="outline" className="rounded-xl" title="Comptage" onClick={() => setAdjusting({ product: p, type: "adjust" })}><Scale size={18} /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adjusting && placeId !== undefined && (
        <AdjustDialog
          product={adjusting.product}
          initialType={adjusting.type}
          locationId={placeId}
          locationName={items?.locationName ?? ""}
          onClose={() => setAdjusting(null)}
          onDone={() => { setAdjusting(null); queryClient.invalidateQueries({ queryKey: ["stock-items"] }); queryClient.invalidateQueries({ queryKey: ["products"] }); }}
        />
      )}
    </div>
  );
}

function AdjustDialog({ product, initialType, locationId, locationName, onClose, onDone }: {
  product: StockProductRow; initialType: Movement; locationId: number; locationName: string; onClose: () => void; onDone: () => void;
}) {
  const [type, setType] = useState<Movement>(initialType);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () => stockApi.adjustProductStockAt(product.id, { type, qty: parseInt(qty, 10), reason: reason.trim() || undefined }, locationId),
    onSuccess: () => { toast.success("Stock mis à jour"); onDone(); },
    onError: (e) => toast.error(getErrorMessage(e, "Ajustement impossible")),
  });
  const n = parseInt(qty, 10);
  const valid = Number.isFinite(n) && n >= 0 && (type === "adjust" || n > 0);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{product.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">{locationName} · actuellement <span className="font-black text-slate-800">{product.qty}</span></p>
        <div className="space-y-4">
          <Select value={type} onValueChange={(v) => setType(v as Movement)}>
            <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(MOVEMENT_LABELS) as Movement[]).map((m) => <SelectItem key={m} value={m}>{MOVEMENT_LABELS[m]}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" min={0} step={1} inputMode="numeric" autoFocus placeholder={type === "adjust" ? "Total compté" : "Quantité"}
                 className="h-14 text-2xl font-black rounded-xl" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input placeholder="Motif (facultatif)" className="h-11 rounded-xl" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Propriétaire : chaque produit, lieu par lieu, avec le total — de quoi voir d'un coup d'œil où est le stock et qui est à sec. */
function ConsolidatedTable() {
  const { locations } = useStockScope();
  const results = useQueries({
    queries: locations.map((l) => ({
      queryKey: ["stock-items", l.id],
      queryFn: () => stockApi.listStockItems(l.id),
    })),
  });
  const loading = results.some((r) => r.isLoading);

  const table = useMemo(() => {
    const byProduct = new Map<number, { name: string; perPlace: Map<number, StockProductRow> }>();
    results.forEach((r, i) => {
      for (const p of r.data?.products ?? []) {
        const entry = byProduct.get(p.id) ?? { name: p.name, perPlace: new Map() };
        entry.perPlace.set(locations[i].id, p);
        byProduct.set(p.id, entry);
      }
    });
    return [...byProduct.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, "fr"));
  }, [results.map((r) => r.dataUpdatedAt).join(","), locations.length]);

  if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (table.length === 0) return <p className="text-slate-500 py-12 text-center">Aucun produit en stock suivi.</p>;

  return (
    <div className="bg-white rounded-[2rem] border shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
            <th className="text-left px-6 py-3">Produit</th>
            {locations.map((l) => <th key={l.id} className="text-right px-4 py-3">{l.name}</th>)}
            <th className="text-right px-6 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {table.map(([id, entry]) => {
            const total = [...entry.perPlace.values()].reduce((sum, p) => sum + p.qty, 0);
            return (
              <tr key={id} className="border-b last:border-0">
                <td className="px-6 py-3 font-bold text-slate-800">{entry.name}</td>
                {locations.map((l) => {
                  const p = entry.perPlace.get(l.id);
                  return (
                    <td key={l.id} className={cn("px-4 py-3 text-right tabular-nums", p?.isLowStock && p.alertQty > 0 ? "text-red-600 font-black" : "text-slate-700", !p && "text-slate-300")}>
                      {p ? p.qty : "—"}
                    </td>
                  );
                })}
                <td className="px-6 py-3 text-right font-black tabular-nums">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
