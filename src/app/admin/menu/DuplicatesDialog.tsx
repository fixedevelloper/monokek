"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Combine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as companyApi from "@/src/lib/api/company";
import * as mergeApi from "@/src/lib/api/productMerge";
import type { DuplicateGroup, MergePlan } from "@/src/lib/api/productMerge";
import { getErrorMessage } from "@/src/lib/errors";

/**
 * Propriétaire : produits créés en double (même SKU), un par succursale avant le catalogue commun. On choisit celui à GARDER ;
 * « Simuler » montre exactement ce que la fusion ferait (rien n'est écrit) ; « Fusionner » n'est proposé qu'après une simulation sans blocage.
 * L'historique des ventes, les stocks et les prix par succursale sont repris par le produit conservé.
 */
export function DuplicatesDialog({ onMerged }: { onMerged: () => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["product-duplicates"], queryFn: () => mergeApi.listDuplicates(), retry: false, staleTime: 60_000,
  });
  const { data: branches = [] } = useQuery({ queryKey: ["branches-for-sharing"], queryFn: () => companyApi.listBranches(), enabled: open });
  const branchName = (id: number | null) => branches.find((b) => b.id === id)?.name ?? (id == null ? "—" : `#${id}`);

  // pas de propriétaire (403) ou rien à fusionner : pas de bouton
  if (error || (!isLoading && groups.length === 0)) return null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["product-duplicates"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    onMerged();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 px-5 rounded-2xl border-none bg-white shadow-sm font-bold gap-2 hover:bg-slate-50">
          <Combine size={18} className="text-primary" />
          <span className="hidden lg:inline">Doublons</span>
          <Badge variant="secondary" className="not-italic tracking-normal">{groups.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[760px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2"><Combine className="text-indigo-600" /> Produits en double</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500">
          Même SKU = même article. Choisissez celui à conserver : les ventes passées, les stocks et les prix par succursale des autres lui sont rattachés.
          Une simulation précède toujours la fusion.
        </p>
        {isLoading ? <Loader2 className="animate-spin text-primary mx-auto" /> : (
          <div className="space-y-4">
            {groups.map((g) => <GroupCard key={g.sku} group={g} branchName={branchName} onMerged={refresh} />)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({ group, branchName, onMerged }: { group: DuplicateGroup; branchName: (id: number | null) => string; onMerged: () => void }) {
  const [keepId, setKeepId] = useState(group.suggestedKeepId);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [plan, setPlan] = useState<MergePlan | null>(null);

  const mergeIds = useMemo(() => group.products.map((p) => p.id).filter((id) => id !== keepId && !excluded.includes(id)), [group, keepId, excluded]);
  const reset = () => setPlan(null); // toute modification invalide la simulation

  const simulate = useMutation({
    mutationFn: () => mergeApi.previewMerge(keepId, mergeIds),
    onSuccess: setPlan,
    onError: (e) => toast.error(getErrorMessage(e, "Simulation impossible")),
  });
  const merge = useMutation({
    mutationFn: () => mergeApi.mergeProducts(keepId, mergeIds),
    onSuccess: () => { toast.success("Produits fusionnés"); setPlan(null); onMerged(); },
    onError: (e) => { toast.error(getErrorMessage(e, "Fusion impossible")); setPlan(null); },
  });

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">{group.sku}</span>
        <span className="text-xs text-slate-500">{group.products.length} produits</span>
      </div>
      <div className="space-y-2">
        {group.products.map((p) => {
          const isKeep = p.id === keepId;
          return (
            <div key={p.id} className={`rounded-xl border p-3 text-sm flex items-start gap-3 ${isKeep ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200"}`}>
              <input type="radio" name={`keep-${group.sku}`} checked={isKeep} onChange={() => { setKeepId(p.id); setExcluded([]); reset(); }} aria-label={`Conserver ${p.name}`} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{p.name} <span className="font-normal text-slate-400">#{p.id}</span>{!p.active && <Badge variant="outline" className="ml-2 not-italic tracking-normal">inactif</Badge>}</div>
                <div className="text-xs text-slate-500">
                  {p.categoryName} · {p.price} · stock {p.stockTotal} · {p.usage} ligne(s) d'historique · vendu : {p.branchIds.map((b) => branchName(b)).join(", ") || "—"}
                </div>
              </div>
              {isKeep ? <Badge className="not-italic tracking-normal bg-emerald-600">À conserver</Badge> : (
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input type="checkbox" checked={!excluded.includes(p.id)} onChange={(e) => { setExcluded((x) => e.target.checked ? x.filter((i) => i !== p.id) : [...x, p.id]); reset(); }} />
                  fusionner
                </label>
              )}
            </div>
          );
        })}
      </div>

      {plan && <PlanView plan={plan} />}

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={mergeIds.length === 0 || simulate.isPending} onClick={() => simulate.mutate()}>
          {simulate.isPending && <Loader2 className="animate-spin mr-2" size={16} />} Simuler
        </Button>
        {plan?.canMerge && (
          <Button disabled={merge.isPending} onClick={() => merge.mutate()}>
            {merge.isPending && <Loader2 className="animate-spin mr-2" size={16} />} Fusionner {mergeIds.length} produit(s)
          </Button>
        )}
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: MergePlan }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-xs">
      {plan.blockers.length > 0 && (
        <div className="text-red-700 space-y-1">
          <div className="font-bold flex items-center gap-1"><AlertTriangle size={14} /> Fusion impossible pour l'instant</div>
          {plan.blockers.map((b, i) => <div key={i}>• {b}</div>)}
        </div>
      )}
      {plan.warnings.length > 0 && (
        <div className="text-amber-700 space-y-1">
          <div className="font-bold">À savoir</div>
          {plan.warnings.map((w, i) => <div key={i}>• {w}</div>)}
        </div>
      )}
      {plan.canMerge && (
        <div className="text-slate-700 space-y-2">
          <div className="font-bold flex items-center gap-1 text-emerald-700"><CheckCircle2 size={14} /> Prêt : « {plan.keepName} » sera conservé</div>
          {plan.merged.map((m) => (
            <div key={m.id}>
              <div className="font-semibold">{m.name} (#{m.id}) sera fusionné</div>
              {m.effects.map((e, i) => <div key={i} className="pl-3">• {e}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
