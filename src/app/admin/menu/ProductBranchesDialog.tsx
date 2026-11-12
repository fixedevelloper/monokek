"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import * as catalogBranchApi from "@/src/lib/api/catalogBranches";
import type { ProductBranchRow } from "@/src/lib/api/catalogBranches";
import * as companyApi from "@/src/lib/api/company";
import { getErrorMessage } from "@/src/lib/errors";
import { Product } from "@/src/types/menus";

/**
 * Propriétaire : dans quelles succursales ce produit est vendu, activé ou non, et à quel prix local (vide = prix de base).
 * Le serveur impose que la catégorie du produit soit déjà utilisée par la succursale ciblée et refuse toute autre incohérence : son message est affiché.
 * Un produit partagé démarre à 0 de stock dans sa nouvelle succursale (voir « Stock › Produits »).
 */
export function ProductBranchesDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const key = ["product-branches", product.id];

  const { data: branches = [] } = useQuery({ queryKey: ["branches-for-sharing"], queryFn: () => companyApi.listBranches(), enabled: open });
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: key, queryFn: () => catalogBranchApi.listProductBranches(product.id), enabled: open, retry: false,
  });
  const forbidden = (error as { response?: { status?: number } } | null)?.response?.status === 403;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600" title="Succursales">
          <Store size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2"><Store className="text-indigo-600" /> {product.name}</DialogTitle>
        </DialogHeader>
        {forbidden ? (
          <p className="text-sm text-slate-500">Réservé au propriétaire (compte administrateur sans succursale assignée).</p>
        ) : isLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Prix de base : <b>{product.price}</b>. Laissez le prix local vide pour garder le prix de base.</p>
            {branches.map((b) => (
              <BranchRow
                key={b.id}
                productId={product.id}
                branchId={b.id}
                branchName={b.name}
                row={rows.find((r) => r.branchId === b.id)}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BranchRow({ productId, branchId, branchName, row, onChanged }: {
  productId: number; branchId: number; branchName: string; row?: ProductBranchRow; onChanged: () => void;
}) {
  const [price, setPrice] = useState(row?.priceOverride != null ? String(row.priceOverride) : "");
  useEffect(() => setPrice(row?.priceOverride != null ? String(row.priceOverride) : ""), [row?.priceOverride]);

  const parsed = price.trim() === "" ? null : Number(price);
  const priceValid = parsed === null || (Number.isFinite(parsed) && parsed >= 0);

  const save = useMutation({
    // Le serveur remplace toujours le prix local : on renvoie les deux champs.
    mutationFn: (v: { active: boolean; priceOverride: number | null }) => catalogBranchApi.saveProductBranch(productId, branchId, v),
    onSuccess: () => { toast.success(`${branchName} : enregistré`); onChanged(); },
    onError: (e) => toast.error(getErrorMessage(e, "Enregistrement impossible")),
  });
  const remove = useMutation({
    mutationFn: () => catalogBranchApi.removeProductBranch(productId, branchId),
    onSuccess: () => { toast.success(`Retiré de ${branchName}`); onChanged(); },
    onError: (e) => toast.error(getErrorMessage(e, "Retrait impossible")),
  });

  if (!row) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed p-4">
        <span className="font-bold text-slate-500">{branchName}</span>
        <Button size="sm" variant="outline" className="rounded-xl font-bold" disabled={save.isPending} onClick={() => save.mutate({ active: true, priceOverride: null })}>
          Vendre ici
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
      <span className="font-bold text-slate-800 flex-1 min-w-32">{branchName}</span>
      <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
        <Switch checked={row.active} disabled={save.isPending} onCheckedChange={(active) => save.mutate({ active, priceOverride: row.priceOverride })} />
        {row.active ? "En vente" : "Désactivé"}
      </label>
      <Input type="number" min={0} className="w-32 h-10 rounded-xl text-right" placeholder="Prix local" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Button size="sm" className="rounded-xl font-bold" disabled={!priceValid || save.isPending || parsed === row.priceOverride}
              onClick={() => save.mutate({ active: row.active, priceOverride: parsed })}>
        OK
      </Button>
      <Button size="icon" variant="ghost" className="rounded-xl text-red-500 hover:bg-red-50" title="Retirer de cette succursale" disabled={remove.isPending}
              onClick={() => { if (window.confirm(`Retirer ce produit de ${branchName} ?`)) remove.mutate(); }}>
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
