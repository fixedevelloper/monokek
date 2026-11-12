"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Plus, Trash2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import * as companyApi from "@/src/lib/api/company";
import * as hubApi from "@/src/lib/api/kitchenHub";
import { getErrorMessage } from "@/src/lib/errors";

const LINKS_KEY = ["kitchen-hub-links"];

/**
 * Cuisine centrale : quelles succursales envoient leurs commandes à la cuisine d'un hub.
 * La commande reste encaissée à la caisse de la succursale d'origine ; le hub ne fait que préparer.
 * Réservé à l'administrateur SANS succursale assignée : le serveur répond 403 aux autres, et la carte l'explique.
 */
export function HubLinksCard() {
    const queryClient = useQueryClient();
    const [branchId, setBranchId] = useState("");
    const [hubBranchId, setHubBranchId] = useState("");
    const [printOriginCopy, setPrintOriginCopy] = useState(false);

    const { data: branches = [] } = useQuery({ queryKey: ["branches-for-hub-links"], queryFn: () => companyApi.listBranches() });
    const { data: links = [], isLoading, error } = useQuery({ queryKey: LINKS_KEY, queryFn: hubApi.listHubLinks, retry: false });

    const forbidden = (error as { response?: { status?: number } } | null)?.response?.status === 403;
    const branchName = (id: number) => branches.find((b) => b.id === id)?.name ?? `#${id}`;
    const refresh = () => queryClient.invalidateQueries({ queryKey: LINKS_KEY });

    const createMutation = useMutation({
        mutationFn: () => hubApi.createHubLink({ branchId: Number(branchId), hubBranchId: Number(hubBranchId), printOriginCopy }),
        onSuccess: () => {
            toast.success("Lien créé : cette succursale peut maintenant utiliser les stations du hub.");
            setBranchId("");
            setHubBranchId("");
            setPrintOriginCopy(false);
            refresh();
        },
        onError: (e) => toast.error(getErrorMessage(e, "Création impossible")),
    });
    const copyMutation = useMutation({
        mutationFn: (v: { id: number; value: boolean }) => hubApi.setHubLinkOriginCopy(v.id, v.value),
        onSuccess: refresh,
        onError: (e) => toast.error(getErrorMessage(e, "Mise à jour impossible")),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => hubApi.deleteHubLink(id),
        onSuccess: () => {
            toast.success("Lien supprimé");
            refresh();
        },
        onError: (e) => toast.error(getErrorMessage(e, "Suppression impossible")),
    });

    const handleDelete = (link: hubApi.KitchenHubLink) => {
        if (!window.confirm(
            `Supprimer le lien ${branchName(link.branchId)} → ${branchName(link.hubBranchId)} ?\n\n` +
            "Les catégories de cette succursale qui pointent vers une station du hub ne pourront plus créer de ticket : " +
            "réaffectez-les à une station locale. Les tickets déjà envoyés restent au hub."
        )) return;
        deleteMutation.mutate(link.id);
    };

    const canSubmit = branchId && hubBranchId && branchId !== hubBranchId && !createMutation.isPending;

    return (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Warehouse size={24} />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase italic">Cuisine centrale</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase">
                            Une succursale liée à un hub peut envoyer ses commandes à ses stations. L&apos;encaissement reste à sa propre caisse.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {forbidden ? (
                    <p className="text-sm text-slate-500">
                        Réservé au propriétaire (compte administrateur sans succursale assignée).
                    </p>
                ) : (
                    <>
                        {isLoading ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" />
                        ) : links.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Aucun lien : chaque succursale n&apos;utilise que ses propres stations.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {links.map((link) => (
                                    <div key={link.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4">
                                        <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100">
                                            <span>{branchName(link.branchId)}</span>
                                            <ArrowRight size={16} className="text-primary" />
                                            <span>{branchName(link.hubBranchId)}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-500">
                                                <Switch
                                                    checked={link.printOriginCopy}
                                                    disabled={copyMutation.isPending}
                                                    onCheckedChange={(value) => copyMutation.mutate({ id: link.id, value })}
                                                />
                                                Copie du ticket à l&apos;origine
                                            </label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                                disabled={deleteMutation.isPending}
                                                onClick={() => handleDelete(link)}
                                            >
                                                <Trash2 size={12} /> Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-500">Nouveau lien</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Succursale qui envoie</Label>
                                    <Select value={branchId} onValueChange={setBranchId}>
                                        <SelectTrigger className="h-12 rounded-2xl bg-white border-none font-bold">
                                            <SelectValue placeholder="Choisir…" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)} className="font-bold">{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Cuisine centrale (hub)</Label>
                                    <Select value={hubBranchId} onValueChange={setHubBranchId}>
                                        <SelectTrigger className="h-12 rounded-2xl bg-white border-none font-bold">
                                            <SelectValue placeholder="Choisir…" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {branches.filter((b) => String(b.id) !== branchId).map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)} className="font-bold">{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-500">
                                    <Switch checked={printOriginCopy} onCheckedChange={setPrintOriginCopy} />
                                    Imprimer aussi le ticket à l&apos;origine
                                </label>
                                <Button
                                    className="rounded-xl gap-2 font-bold uppercase text-[10px]"
                                    disabled={!canSubmit}
                                    onClick={() => createMutation.mutate()}
                                >
                                    {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    Créer le lien
                                </Button>
                            </div>
                            <p className="text-[10px] text-slate-400">
                                Un hub ne peut pas lui-même dépendre d&apos;un autre hub, et une succursale qui est un hub ne peut pas envoyer ailleurs.
                                Ensuite, affectez les catégories voulues à une station du hub depuis Menu → Catégories.
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
