"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/src/lib/axios";
import { getErrorMessage } from "@/src/lib/errors";
import { useAuthStore } from "@/src/store/use-auth-store";
import { PERMISSIONS } from "@/src/constants/roles";

/**
 * Commission globale (un pourcentage de la vente). DÉSACTIVÉE par défaut : un produit sans commission spéciale ne rapporte rien.
 * La commission spéciale d'un produit (fiche produit) passe toujours avant. Réservé à qui gère les commissions ET les réglages.
 */
export function CommissionPolicyCard() {
  const queryClient = useQueryClient();
  const can = useAuthStore((s) => s.hasPermission);
  const mayEdit = can(PERMISSIONS.MANAGE_COMMISSIONS) && can(PERMISSIONS.MANAGE_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ["commission-policy"],
    queryFn: async () => (await api.get("/api/admin/settings")).data as Record<string, unknown>,
  });

  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState("2");
  const [includeStorable, setIncludeStorable] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.commission_global_enabled === true || data.commission_global_enabled === "true");
    setRate(data.commission_global_rate != null ? String(data.commission_global_rate) : "2");
    setIncludeStorable(data.commission_global_include_storable === true || data.commission_global_include_storable === "true");
  }, [data]);

  const rateNumber = parseFloat(rate.replace(",", "."));
  const rateValid = !enabled || (Number.isFinite(rateNumber) && rateNumber > 0 && rateNumber <= 100);

  const save = useMutation({
    mutationFn: () =>
      api.post("/api/admin/settings", {
        settings: {
          commission_global_enabled: enabled,
          commission_global_rate: Number.isFinite(rateNumber) ? rateNumber : 0,
          commission_global_include_storable: includeStorable,
        },
      }),
    onSuccess: () => {
      toast.success("Règle de commission enregistrée");
      queryClient.invalidateQueries({ queryKey: ["commission-policy"] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "Enregistrement impossible")),
  });

  return (
    <Card className="rounded-[2rem] border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase italic">
          <Percent size={18} className="text-indigo-600" /> Commission globale
        </CardTitle>
        <CardDescription>
          Un pourcentage versé sur les produits qui n&apos;ont pas de commission spéciale. Désactivée : ces produits ne rapportent rien.
          La commission spéciale d&apos;un produit passe toujours avant. Ne s&apos;applique qu&apos;aux commandes payées après l&apos;enregistrement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <Loader2 className="animate-spin text-indigo-600" />
        ) : (
          <>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <Label htmlFor="commission-enabled" className="font-bold">Activer la commission globale</Label>
              <Switch id="commission-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={!mayEdit} />
            </div>
            {enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Taux (%)</Label>
                  <Input type="number" min={0} max={100} step="0.1" value={rate} disabled={!mayEdit}
                         onChange={(e) => setRate(e.target.value)} className="h-12 rounded-2xl font-bold" />
                  <p className="text-xs text-muted-foreground">Calculé sur le montant réellement payé (après remise ou coupon).</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <Label htmlFor="commission-storable" className="font-bold">Inclure les produits en stock</Label>
                    <p className="text-xs text-muted-foreground">Bouteilles, packs… Par défaut seuls les plats préparés comptent.</p>
                  </div>
                  <Switch id="commission-storable" checked={includeStorable} onCheckedChange={setIncludeStorable} disabled={!mayEdit} />
                </div>
              </div>
            )}
            {mayEdit ? (
              <Button onClick={() => save.mutate()} disabled={save.isPending || !rateValid} className="rounded-2xl h-11 font-bold">
                {save.isPending ? <Loader2 className="animate-spin" /> : "Enregistrer"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Modification réservée aux comptes qui gèrent les commissions et les réglages.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
