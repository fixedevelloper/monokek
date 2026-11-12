"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as companyApi from "@/src/lib/api/company";
import * as stockApi from "@/src/lib/api/stock";
import { getErrorMessage } from "@/src/lib/errors";

/**
 * Entrepôt général : le lieu qui reçoit les achats et approvisionne les succursales. Ses magasiniers (rôle « warehouse ») sont les comptes de la
 * SUCCURSALE à laquelle on le rattache ici : créez d'abord une succursale « Entrepôt » (Organisation), puis rattachez-la, puis donnez le rôle
 * aux comptes concernés. Propriétaire seulement (administrateur sans succursale).
 */
export function WarehouseCard() {
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState("");

  const { data: locations = [], isLoading, error } = useQuery({ queryKey: ["stock-locations"], queryFn: stockApi.listStockLocations, retry: false });
  const { data: branches = [] } = useQuery({ queryKey: ["branches-for-warehouse"], queryFn: () => companyApi.listBranches() });

  const warehouse = locations.find((l) => l.kind === "WAREHOUSE");
  const linkedBranch = branches.find((b) => b.id === warehouse?.branchId);
  const forbidden = (error as { response?: { status?: number } } | null)?.response?.status === 403;
  // Une succursale qui vend déjà (donc qui a son propre stock) ne peut pas devenir l'entrepôt.
  const sellingBranchIds = new Set(locations.filter((l) => l.kind === "BRANCH").map((l) => l.branchId));

  const link = useMutation({
    mutationFn: () => stockApi.linkWarehouse(Number(branchId)),
    onSuccess: () => {
      toast.success("Entrepôt rattaché");
      setBranchId("");
      queryClient.invalidateQueries({ queryKey: ["stock-locations"] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "Rattachement impossible")),
  });

  return (
    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
      <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Warehouse size={24} /></div>
          <div>
            <CardTitle className="text-sm font-black uppercase italic">Entrepôt général</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase">
              Stock central : reçoit les achats, approvisionne les succursales. Les ingrédients y restent ; seuls les produits se transfèrent.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" />
        ) : forbidden ? (
          <p className="text-sm text-slate-500">Réservé au propriétaire.</p>
        ) : (
          <>
            <p className="text-sm text-slate-700">
              {linkedBranch
                ? <>Rattaché à la succursale <b>{linkedBranch.name}</b> : ses comptes au rôle « warehouse » gèrent l&apos;entrepôt.</>
                : <>Pas encore rattaché : seul le propriétaire peut agir sur l&apos;entrepôt. Créez une succursale dédiée (Organisation), rattachez-la ici, puis donnez le rôle « warehouse » à vos magasiniers.</>}
            </p>
            {warehouse && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">{linkedBranch ? "Changer la succursale de l'entrepôt" : "Succursale de l'entrepôt"}</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {branches.filter((b) => !sellingBranchIds.has(b.id) && b.id !== warehouse.branchId).map((b) => (
                        <SelectItem key={b.id} value={String(b.id)} className="font-bold">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="rounded-xl font-bold uppercase text-[10px] h-12" disabled={!branchId || link.isPending} onClick={() => link.mutate()}>
                  {link.isPending ? <Loader2 className="animate-spin" size={16} /> : "Rattacher"}
                </Button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Seules les succursales sans stock propre sont proposées : une succursale qui vend ne peut pas être l&apos;entrepôt.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
