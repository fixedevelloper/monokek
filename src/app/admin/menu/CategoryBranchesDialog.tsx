"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import * as catalogBranchApi from "@/src/lib/api/catalogBranches";
import type { CategoryBranchRow } from "@/src/lib/api/catalogBranches";
import * as companyApi from "@/src/lib/api/company";
import * as kitchenStationApi from "@/src/lib/api/kitchenStation";
import { getErrorMessage } from "@/src/lib/errors";
import { stationLabel } from "@/src/types/kitchenStation";
import { Category } from "@/src/types/menus";

const NO_STATION = "none";

/**
 * Propriétaire : quelles succursales utilisent cette catégorie, et vers quelle station de cuisine CHACUNE envoie ses tickets — une cuisine
 * locale, ou celle de la cuisine centrale à laquelle elle est liée. Une catégorie ne peut quitter une succursale tant que des produits y sont en vente.
 */
export function CategoryBranchesDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const categoryId = category.id as number;
  const key = ["category-branches", categoryId];

  const { data: branches = [] } = useQuery({ queryKey: ["branches-for-sharing"], queryFn: () => companyApi.listBranches(), enabled: open });
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: key, queryFn: () => catalogBranchApi.listCategoryBranches(categoryId), enabled: open && category.id != null, retry: false,
  });
  const forbidden = (error as { response?: { status?: number } } | null)?.response?.status === 403;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["usable-stations"] });
  };

  if (category.id == null) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/10" title="Succursales de cette catégorie"><Store size={14} /></button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2"><Store className="text-indigo-600" /> {category.name}</DialogTitle>
        </DialogHeader>
        {forbidden ? (
          <p className="text-sm text-slate-500">Réservé au propriétaire (compte administrateur sans succursale assignée).</p>
        ) : isLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" />
        ) : (
          <div className="space-y-3">
            {branches.map((b) => (
              <Row key={b.id} categoryId={categoryId} branchId={b.id} branchName={b.name} row={rows.find((r) => r.branchId === b.id)} onChanged={refresh} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ categoryId, branchId, branchName, row, onChanged }: {
  categoryId: number; branchId: number; branchName: string; row?: CategoryBranchRow; onChanged: () => void;
}) {
  // Les stations que CETTE succursale peut utiliser : les siennes + celles de sa cuisine centrale.
  const { data: stations = [] } = useQuery({
    queryKey: ["usable-stations", branchId], queryFn: () => kitchenStationApi.listUsableStations(branchId),
  });
  const [station, setStation] = useState<string>(row?.kitchenStationId != null ? String(row.kitchenStationId) : NO_STATION);
  useEffect(() => setStation(row?.kitchenStationId != null ? String(row.kitchenStationId) : NO_STATION), [row?.kitchenStationId]);
  const stationId = station === NO_STATION ? null : Number(station);

  const save = useMutation({
    // Le serveur remplace toujours la station : on renvoie les deux champs.
    mutationFn: (v: { kitchenStationId: number | null; active: boolean }) => catalogBranchApi.saveCategoryBranch(categoryId, branchId, v),
    onSuccess: () => { toast.success(`${branchName} : enregistré`); onChanged(); },
    onError: (e) => toast.error(getErrorMessage(e, "Enregistrement impossible")),
  });
  const remove = useMutation({
    mutationFn: () => catalogBranchApi.removeCategoryBranch(categoryId, branchId),
    onSuccess: () => { toast.success(`Retirée de ${branchName}`); onChanged(); },
    onError: (e) => toast.error(getErrorMessage(e, "Retrait impossible")),
  });

  if (!row) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed p-4">
        <span className="font-bold text-slate-500">{branchName}</span>
        <Button size="sm" variant="outline" className="rounded-xl font-bold" disabled={save.isPending} onClick={() => save.mutate({ kitchenStationId: null, active: true })}>
          Utiliser ici
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
      <span className="font-bold text-slate-800 flex-1 min-w-32">{branchName}</span>
      <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
        <Switch checked={row.active} disabled={save.isPending} onCheckedChange={(active) => save.mutate({ kitchenStationId: row.kitchenStationId, active })} />
        {row.active ? "Active" : "Désactivée"}
      </label>
      <Select value={station} onValueChange={setStation}>
        <SelectTrigger className="w-60 h-10 rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_STATION}>Aucune station</SelectItem>
          {stations.map((s) => <SelectItem key={s.id} value={String(s.id)}>{stationLabel(s, branchId)}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" className="rounded-xl font-bold" disabled={save.isPending || stationId === row.kitchenStationId}
              onClick={() => save.mutate({ kitchenStationId: stationId, active: row.active })}>
        OK
      </Button>
      <Button size="icon" variant="ghost" className="rounded-xl text-red-500 hover:bg-red-50" title="Retirer cette catégorie de la succursale" disabled={remove.isPending}
              onClick={() => { if (window.confirm(`Retirer cette catégorie de ${branchName} ?`)) remove.mutate(); }}>
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
