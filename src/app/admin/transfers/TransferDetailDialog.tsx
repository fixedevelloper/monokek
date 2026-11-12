"use client";

import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Check, Loader2, PackageCheck, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/src/lib/errors";
import { cn } from "@/src/lib/utils";
import * as transferApi from "@/src/lib/api/stockTransfers";
import type { StockTransfer, TransferLine } from "@/src/lib/api/stockTransfers";
import type { StockScope } from "@/src/lib/api/stock";

export const STATUS_STYLES: Record<transferApi.TransferStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-500",
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : null);

/**
 * Un transfert et ce qu'on peut en faire selon son état et qui on est. L'écran propose les actions plausibles ; c'est le serveur qui décide
 * (un refus s'affiche tel quel).
 *  - fournisseur (propriétaire / magasinier) : approuver, expédier (quantités réellement parties), annuler ;
 *  - succursale destinataire (ou propriétaire) : confirmer la réception en saisissant ce qui est RÉELLEMENT arrivé — un écart est signalé ;
 *  - propriétaire seul : reprendre un envoi déjà parti (le stock retourne à l'entrepôt, motif obligatoire).
 */
export function TransferDetailDialog({ transfer, scope, myLocationId, onClose, onChanged }: {
  transfer: StockTransfer | null;
  scope: StockScope;
  myLocationId?: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Repart des quantités attendues à chaque ouverture / changement d'état.
  useEffect(() => {
    if (!transfer) return;
    const base: Record<number, string> = {};
    for (const l of transfer.lines) {
      const expected = transfer.status === "SHIPPED" ? l.qtyShipped : l.qtyRequested;
      base[l.id] = String(expected ?? l.qtyRequested);
    }
    setCounts(base);
    setReason("");
    setCancelling(false);
  }, [transfer?.id, transfer?.status]);

  const run = useMutation({
    mutationFn: (action: () => Promise<StockTransfer>) => action(),
    onSuccess: (t) => {
      toast.success(`${t.reference} : ${transferApi.TRANSFER_STATUS_LABELS[t.status].toLowerCase()}`);
      onChanged();
    },
    onError: (e) => toast.error(getErrorMessage(e, "Action impossible")),
  });

  if (!transfer) return null;
  const t = transfer;
  const supplier = scope === "owner" || scope === "warehouse";
  const isDestination = scope === "owner" || (scope === "branch" && myLocationId === t.to.id);
  const lineQty = (l: TransferLine) => parseFloat(counts[l.id] ?? "");
  const payload = () => t.lines.map((l) => ({ lineId: l.id, qty: lineQty(l) }));
  const valid = t.lines.every((l) => Number.isFinite(lineQty(l)) && lineQty(l) >= 0);
  const shortLines = t.status === "SHIPPED" ? t.lines.filter((l) => lineQty(l) < (l.qtyShipped ?? 0)) : [];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-[2rem] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3 text-2xl font-black italic uppercase tracking-tighter">
            {t.reference}
            <Badge className={cn("rounded-full text-[10px] uppercase not-italic tracking-normal font-bold", STATUS_STYLES[t.status])}>{transferApi.TRANSFER_STATUS_LABELS[t.status]}</Badge>
            {t.hasDiscrepancy && <Badge className="rounded-full text-[10px] uppercase not-italic tracking-normal font-bold bg-red-100 text-red-700 gap-1"><AlertTriangle size={12} /> Écart</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            {t.from.name} <ArrowRight size={16} className="text-primary" /> {t.to.name}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p>Demandé par {t.requestedByName ?? `#${t.requestedBy}`} le {fmtDate(t.createdAt)}</p>
            {t.approvedAt && <p>Approuvé le {fmtDate(t.approvedAt)}</p>}
            {t.shippedAt && <p>Expédié le {fmtDate(t.shippedAt)}</p>}
            {t.receivedAt && <p>Reçu le {fmtDate(t.receivedAt)}</p>}
            {t.cancelledAt && <p>Annulé le {fmtDate(t.cancelledAt)}{t.cancelReason ? ` — ${t.cancelReason}` : ""}</p>}
            {t.note && <p className="text-slate-600">Note : {t.note}</p>}
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <div className="grid grid-cols-[1fr_5rem_5rem_6rem] gap-2 px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Produit</span><span className="text-right">Demandé</span><span className="text-right">Expédié</span><span className="text-right">
                {t.status === "SHIPPED" ? "Compté" : "Reçu"}</span>
            </div>
            {t.lines.map((l) => {
              const gap = l.qtyReceived !== null && l.qtyShipped !== null && l.qtyReceived < l.qtyShipped;
              const editShip = t.status === "APPROVED" && supplier;
              const editReceive = t.status === "SHIPPED" && isDestination;
              return (
                <div key={l.id} className="grid grid-cols-[1fr_5rem_5rem_6rem] gap-2 items-center px-4 py-3 border-t">
                  <span className="font-bold text-slate-800 truncate">{l.name}</span>
                  <span className="text-right tabular-nums">{l.qtyRequested}</span>
                  {editShip ? (
                    <Input type="number" min={0} step={1} className="h-9 rounded-lg text-right font-black"
                           value={counts[l.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [l.id]: e.target.value }))} />
                  ) : (
                    <span className="text-right tabular-nums">{l.qtyShipped ?? "—"}</span>
                  )}
                  {editReceive ? (
                    <Input type="number" min={0} step={1} className="h-9 rounded-lg text-right font-black"
                           value={counts[l.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [l.id]: e.target.value }))} />
                  ) : (
                    <span className={cn("text-right tabular-nums font-bold", gap && "text-red-600")}>{l.qtyReceived ?? "—"}</span>
                  )}
                </div>
              );
            })}
          </div>

          {shortLines.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Écart : {shortLines.map((l) => `${l.name} (${l.qtyShipped! - lineQty(l)} manquant)`).join(", ")}. Il sera signalé au propriétaire ;
              ce qui manque n&apos;est pas remis en stock.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {t.status === "REQUESTED" && supplier && (
              <Button className="rounded-2xl h-12 gap-2 font-bold" disabled={run.isPending} onClick={() => run.mutate(() => transferApi.approveTransfer(t.id))}>
                <Check size={18} /> Approuver
              </Button>
            )}
            {t.status === "APPROVED" && supplier && (
              <Button className="rounded-2xl h-12 gap-2 font-bold" disabled={run.isPending || !valid}
                      onClick={() => run.mutate(() => transferApi.shipTransfer(t.id, payload()))}>
                <Truck size={18} /> Expédier
              </Button>
            )}
            {t.status === "SHIPPED" && isDestination && (
              <Button className="rounded-2xl h-12 gap-2 font-bold bg-emerald-600 hover:bg-emerald-700" disabled={run.isPending || !valid}
                      onClick={() => run.mutate(() => transferApi.receiveTransfer(t.id, payload()))}>
                <PackageCheck size={18} /> Confirmer la réception
              </Button>
            )}
            {(t.status === "REQUESTED" || t.status === "APPROVED" || (t.status === "SHIPPED" && scope === "owner")) && !cancelling && (
              <Button variant="outline" className="rounded-2xl h-12 gap-2 font-bold text-red-600 border-red-100 hover:bg-red-50" onClick={() => setCancelling(true)}>
                <X size={18} /> {t.status === "SHIPPED" ? "Reprendre l'envoi" : "Annuler"}
              </Button>
            )}
            {run.isPending && <Loader2 className="animate-spin text-primary self-center" />}
          </div>

          {cancelling && (
            <div className="space-y-3 rounded-2xl bg-red-50/60 p-4">
              <p className="text-sm text-red-700">
                {t.status === "SHIPPED"
                  ? "Le stock expédié retournera à l'entrepôt. Indiquez pourquoi (envoi perdu, refusé…)."
                  : "Ce transfert sera annulé sans déplacer de stock."}
              </p>
              <Input placeholder={t.status === "SHIPPED" ? "Motif (obligatoire)" : "Motif (facultatif)"} value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl h-11 bg-white" />
              <div className="flex gap-3">
                <Button className="rounded-xl bg-red-600 hover:bg-red-700 font-bold" disabled={run.isPending || (t.status === "SHIPPED" && reason.trim() === "")}
                        onClick={() => run.mutate(() => transferApi.cancelTransfer(t.id, reason.trim() || undefined))}>
                  Confirmer
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={() => setCancelling(false)}>Retour</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
