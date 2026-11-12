"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as stockApi from "@/src/lib/api/stock";
import * as transferApi from "@/src/lib/api/stockTransfers";
import { getErrorMessage } from "@/src/lib/errors";
import { cn } from "@/src/lib/utils";
import { useStockScope } from "./useStockScope";

/**
 * Nouvelle demande (succursale) ou nouvel envoi (entrepôt / propriétaire). Seuls des PRODUITS se transfèrent : les ingrédients restent au stock central.
 * Un fournisseur choisit la succursale à approvisionner ; une succursale demande toujours pour elle-même.
 */
export function NewTransferDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { scope, isSupplier, warehouse, myLocation } = useStockScope();
  const [branchId, setBranchId] = useState<string>("");
  const [qty, setQty] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const { data: destinations = [] } = useQuery({
    queryKey: ["transfer-destinations"],
    queryFn: stockApi.listTransferDestinations,
    enabled: open && isSupplier,
  });

  // Ce que l'entrepôt a (fournisseur) / ce que la succursale vend et possède (compte de succursale).
  const { data: source, isLoading } = useQuery({
    queryKey: ["stock-items", "transfer-source", scope, warehouse?.id],
    queryFn: () => stockApi.listStockItems(isSupplier ? warehouse?.id : undefined),
    enabled: open && (!isSupplier || !!warehouse),
  });

  const products = useMemo(
    () => (source?.products ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [source, search],
  );

  const chosen = Object.entries(qty)
    .map(([id, value]) => ({ productId: Number(id), qty: parseInt(value, 10) }))
    .filter((l) => Number.isFinite(l.qty) && l.qty > 0);

  /** Compte de succursale : propose de remonter chaque produit sous son seuil d'alerte à deux fois ce seuil. */
  const suggest = () => {
    const next: Record<number, string> = {};
    for (const p of source?.products ?? []) {
      if (p.alertQty > 0 && p.qty <= p.alertQty) next[p.id] = String(Math.max(p.alertQty * 2 - p.qty, 1));
    }
    if (Object.keys(next).length === 0) {
      toast.info("Aucun produit sous son seuil d'alerte.");
      return;
    }
    setQty(next);
  };

  const reset = () => {
    setQty({});
    setNote("");
    setSearch("");
    setBranchId("");
  };

  const create = useMutation({
    mutationFn: () => transferApi.createTransfer({
      toBranchId: isSupplier ? Number(branchId) : undefined,
      note: note.trim() || undefined,
      lines: chosen,
    }),
    onSuccess: (t) => {
      toast.success(`${t.reference} créé (${transferApi.TRANSFER_STATUS_LABELS[t.status].toLowerCase()})`);
      reset();
      onCreated();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e, "Création impossible")),
  });

  const canSubmit = chosen.length > 0 && (!isSupplier || branchId !== "") && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="rounded-[2rem] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
            {isSupplier ? "Nouvel envoi" : "Nouvelle demande"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {isSupplier ? (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Succursale à approvisionner</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-12 w-full rounded-2xl bg-slate-100 border-none font-bold"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {destinations.map((d) => <SelectItem key={d.branchId} value={String(d.branchId)} className="font-bold">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Demande pour <span className="font-bold text-slate-800">{myLocation?.name ?? "votre succursale"}</span>, servie par l&apos;entrepôt général.
            </p>
          )}

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Rechercher un produit…" className="pl-11 h-11 rounded-xl border-none bg-slate-100" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {!isSupplier && (
              <Button type="button" variant="outline" className="h-11 rounded-xl gap-2 font-bold" onClick={suggest}>
                <Sparkles size={16} /> Suggérer
              </Button>
            )}
          </div>

          <div className="rounded-2xl border divide-y max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">Aucun produit.</p>
            ) : products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{p.name}</p>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wide", p.isLowStock ? "text-red-500" : "text-slate-400")}>
                    {isSupplier ? "À l'entrepôt" : "Chez vous"} : {p.qty}{p.alertQty > 0 ? ` · alerte ${p.alertQty}` : ""}
                  </p>
                </div>
                <Input
                  type="number" min={0} step={1} inputMode="numeric" placeholder="0"
                  className="w-24 h-11 rounded-xl text-right font-black"
                  value={qty[p.id] ?? ""}
                  onChange={(e) => setQty((q) => ({ ...q, [p.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Note (facultatif)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl h-11" placeholder="Ex: pour le week-end" />
          </div>

          <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest" disabled={!canSubmit} onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="animate-spin" /> : `${isSupplier ? "Créer l'envoi" : "Envoyer la demande"} (${chosen.length} produit${chosen.length > 1 ? "s" : ""})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
