"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as transferApi from "@/src/lib/api/stockTransfers";
import type { StockTransfer, TransferStatus } from "@/src/lib/api/stockTransfers";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import { cn } from "@/src/lib/utils";
import { NewTransferDialog } from "./NewTransferDialog";
import { StockNav } from "./StockNav";
import { STATUS_STYLES, TransferDetailDialog } from "./TransferDetailDialog";
import { useStockScope } from "./useStockScope";

const TRANSFERS_KEY = ["stock-transfers"];

type Filter = "all" | "todo" | "route" | "done";
const FILTERS: { id: Filter; label: string; statuses: TransferStatus[] | null }[] = [
  { id: "all", label: "Tous", statuses: null },
  { id: "todo", label: "À traiter", statuses: ["REQUESTED", "APPROVED"] },
  { id: "route", label: "En route", statuses: ["SHIPPED"] },
  { id: "done", label: "Terminés", statuses: ["RECEIVED", "CANCELLED"] },
];

/**
 * Transferts de stock de l'entrepôt vers les succursales. Une succursale demande et confirme ses réceptions ; l'entrepôt approuve et expédie ;
 * le propriétaire voit tout. Mis à jour en direct quand l'autre partie agit.
 */
export default function TransfersPage() {
  const queryClient = useQueryClient();
  const { scope, myLocation, isLoading: scopeLoading } = useStockScope();
  const [filter, setFilter] = useState<Filter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { on } = useNotifications();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: TRANSFERS_KEY,
    queryFn: () => transferApi.listTransfers(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });

  // L'autre partie a agi (demande reçue, envoi en route…) : on recharge et on le dit.
  useEffect(() => {
    return on("stock-transfer.updated", (payload) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      const status = payload?.status as TransferStatus | undefined;
      if (status) toast.info(`Transfert #${payload?.transferId} : ${transferApi.TRANSFER_STATUS_LABELS[status].toLowerCase()}`);
    });
  }, [on]);

  const visible = useMemo(() => {
    const statuses = FILTERS.find((f) => f.id === filter)?.statuses;
    return statuses ? transfers.filter((t) => statuses.includes(t.status)) : transfers;
  }, [transfers, filter]);

  // Garde le dialogue synchronisé avec la liste rechargée.
  const selected: StockTransfer | null = transfers.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl hover:bg-slate-100 p-2">
            <ArrowLeft size={28} className="text-slate-900" />
          </Button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Transferts</h1>
        </div>
        <Button onClick={() => setNewOpen(true)} className="rounded-2xl gap-2 h-12 px-6 shadow-xl shadow-primary/20">
          <Plus size={20} />
          <span className="font-bold uppercase tracking-tight">{scope === "branch" ? "Demander du stock" : "Nouvel envoi"}</span>
        </Button>
      </div>

      <StockNav />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn("rounded-full px-5 h-9 text-[11px] font-black uppercase tracking-widest transition-all",
              filter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading || scopeLoading ? (
        <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
      ) : visible.length === 0 ? (
        <p className="text-slate-500 py-12 text-center">Aucun transfert.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className="text-left bg-white rounded-[2rem] border-2 border-slate-100 hover:border-primary/30 p-6 transition-all space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-black tracking-tight text-lg">{t.reference}</span>
                <div className="flex gap-2">
                  {t.hasDiscrepancy && <Badge className="rounded-full text-[10px] uppercase bg-red-100 text-red-700 gap-1"><AlertTriangle size={12} /> Écart</Badge>}
                  <Badge className={cn("rounded-full text-[10px] uppercase", STATUS_STYLES[t.status])}>{transferApi.TRANSFER_STATUS_LABELS[t.status]}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                {t.from.name} <ArrowRight size={14} className="text-primary" /> {t.to.name}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">
                {t.lines.map((l) => `${l.name} × ${l.qtyRequested}`).join(" · ")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t.createdAt ? new Date(t.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}
                {t.requestedByName ? ` · ${t.requestedByName}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      <NewTransferDialog open={newOpen} onOpenChange={setNewOpen} onCreated={refresh} />
      <TransferDetailDialog
        transfer={selected}
        scope={scope}
        myLocationId={myLocation?.id}
        onClose={() => setSelectedId(null)}
        onChanged={() => { refresh(); queryClient.invalidateQueries({ queryKey: ["stock-items"] }); }}
      />
    </div>
  );
}
