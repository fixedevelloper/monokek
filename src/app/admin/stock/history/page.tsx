"use client";

import React, {Suspense, useEffect, useState} from 'react';
import {ArrowDownLeft, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, FileText, Loader2, RefreshCcw, Search, Truck, X} from 'lucide-react';
import {format, subDays} from "date-fns";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useRouter, useSearchParams} from "next/navigation";
import {Card} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {useExport} from '@/src/hooks/useExport';
import {toast} from 'sonner';
import {useQuery} from '@tanstack/react-query';
import * as reportingApi from '@/src/lib/api/reporting';
import {StockMovementRowDto} from '@/src/lib/api/types/reporting';
import {DateRangePicker} from "@/components/ui/date-range-picker";
import {DateRange} from "react-day-picker";
import {useStockStore} from "@/src/store/use-stock-store";

const PAGE_SIZE = 50;

const TYPE_FILTERS = [
  {value: "all", label: "Tous les types"},
  {value: "in", label: "Entrée"},
  {value: "out", label: "Sortie"},
  {value: "adjust", label: "Ajustement"},
  {value: "purchase", label: "Achat Fournisseur"},
] as const;

function typeLabel(movement: StockMovementRowDto) {
  if (movement.purchase) return "Achat Fournisseur";
  if (movement.type === "in") return "Entrée";
  if (movement.type === "out") return "Sortie";
  return "Ajustement";
}

export default function StockHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black uppercase text-xs">Chargement...</div>}>
      <StockHistoryContent />
    </Suspense>
  );
}

function StockHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Deep-link depuis la fiche ingrédient (bouton "Historique") — voir admin/stock/page.tsx.
  // Un plafond de 30 jours n'a pas de sens ici : on veut tout l'historique de CET ingrédient.
  const ingredientIdParam = searchParams.get('ingredient_id');
  const ingredientId = ingredientIdParam ? Number(ingredientIdParam) : undefined;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [appliedRange, setAppliedRange] = useState<DateRange>(
      ingredientId ? {from: undefined, to: undefined} : {from: subDays(new Date(), 30), to: new Date()}
  );
  const {exportToPDF, isExporting} = useExport();
  const {ingredients, fetchIngredients} = useStockStore();

  useEffect(() => {
    if (ingredientId) fetchIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientId]);

  const scopedIngredientName = ingredientId
      ? ingredients.find((i) => i.id === ingredientId)?.name ?? `Ingrédient #${ingredientId}`
      : null;

  const clearIngredientScope = () => {
    setPage(0);
    router.push('/admin/stock/history');
  };

  const filters = {
    search: search || undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
    startDate: appliedRange.from ? format(appliedRange.from, 'yyyy-MM-dd') : undefined,
    endDate: appliedRange.to
        ? format(appliedRange.to, 'yyyy-MM-dd')
        : appliedRange.from ? format(appliedRange.from, 'yyyy-MM-dd') : undefined,
    ingredientId,
  };

  const {data, isLoading} = useQuery({
    queryKey: ['stock-movements', filters.search, filters.type, filters.startDate, filters.endDate, filters.ingredientId, page],
    queryFn: () => reportingApi.listStockMovements({...filters, page, size: PAGE_SIZE}),
  });

  const movements = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  const handleFilterChange = () => setPage(0);

  const handleExport = async () => {
    try {
      // Une seule page large englobant tout le jeu filtré — l'export doit refléter exactement
      // ce que les filtres à l'écran désignent, pas seulement la page actuellement affichée.
      const full = await reportingApi.listStockMovements({...filters, page: 0, size: 5000});
      if (full.content.length === 0) {
        toast.error("Aucun mouvement à exporter");
        return;
      }

      const totalIn = full.content.filter((m) => m.qty > 0).reduce((sum, m) => sum + m.qty, 0);
      const totalOut = full.content.filter((m) => m.qty < 0).reduce((sum, m) => sum + Math.abs(m.qty), 0);

      const rangeLabel = appliedRange.from
          ? `${format(appliedRange.from, 'dd/MM/yyyy')} au ${appliedRange.to ? format(appliedRange.to, 'dd/MM/yyyy') : format(appliedRange.from, 'dd/MM/yyyy')}`
          : "Toutes dates";

      await exportToPDF({
        title: "Historique des mouvements de stock",
        subtitle: `Période : ${rangeLabel}${typeFilter !== "all" ? ` — Type : ${TYPE_FILTERS.find(t => t.value === typeFilter)?.label}` : ""}${search ? ` — Recherche : "${search}"` : ""}`,
        filename: "historique_stock",
        columns: ['Date', 'Produit / Storage', 'Type', 'Quantité', 'Motif', 'Auteur'],
        summary: [
          {label: "Total Entrées", value: `+${totalIn}`},
          {label: "Total Sorties", value: `-${totalOut}`},
        ],
      }, full.content.map((m) => [
        new Date(m.occurredAt).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}),
        m.subjectName,
        typeLabel(m),
        `${m.qty >= 0 ? '+' : ''}${m.qty}`,
        m.reason ?? '',
        m.authorName,
      ]));
    } catch (error) {
      toast.error("Impossible de générer l'export");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-2xl border-2 border-slate-200 h-14 w-14 flex items-center justify-center p-0 bg-white"
          >
            <ArrowLeft size={28} />
          </Button>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
              Historique des <span className="text-primary">Mouvements</span>
            </h1>
            {scopedIngredientName ? (
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest gap-2 px-3 py-1.5 rounded-xl">
                  {scopedIngredientName}
                  <button onClick={clearIngredientScope} className="hover:text-red-600 transition-colors" title="Retirer le filtre">
                    <X size={12} />
                  </button>
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground font-medium mt-1">Traçabilité complète des ingrédients et produits stockés.</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-2xl border-2 font-black uppercase tracking-widest gap-2 h-14 px-6"
        >
          {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
          Exporter en PDF
        </Button>
      </div>

      {/* FILTRES */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrer par produit, ingrédient ou motif..."
            className="pl-12 h-12 rounded-xl border-none bg-slate-50 font-medium"
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
          />
        </div>

        <DateRangePicker
          initialRange={appliedRange}
          onApply={(range) => { if (range) { setAppliedRange(range); handleFilterChange(); } }}
        />

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); handleFilterChange(); }}>
          <SelectTrigger className="h-12 w-full md:w-56 rounded-xl border-none bg-slate-50 font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TABLEAU */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8">Date / Heure</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Produit / Storage</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Type</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Quantité</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Motif</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest pr-8">Auteur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <Loader2 className="animate-spin" />
                    <span className="text-[10px] font-black uppercase">Chargement des mouvements...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <p className="text-slate-400 font-bold italic">Aucun mouvement trouvé.</p>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m, idx) => <MovementRow key={idx} movement={m} />)
            )}
          </TableBody>
        </Table>
      </Card>

      {/* PAGINATION */}
      {totalElements > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            {totalElements} mouvement{totalElements > 1 ? "s" : ""} — page {page + 1} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-xl">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MovementRow({movement}: { movement: StockMovementRowDto }) {
  const isPositive = movement.qty >= 0;
  const isAdjustment = movement.type === 'adjust';

  return (
    <TableRow className="border-slate-100 hover:bg-slate-50/50 transition-colors">
      <TableCell className="pl-8 py-5">
        <p className="text-sm font-bold text-slate-700">
          {new Date(movement.occurredAt).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'})}
        </p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          {new Date(movement.occurredAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
        </p>
      </TableCell>
      <TableCell className="font-bold">{movement.subjectName}</TableCell>
      <TableCell className="text-center">
        <Badge className={cn(
          "border-none uppercase text-[9px] font-black tracking-widest gap-1",
          movement.purchase ? "bg-blue-500/10 text-blue-600" :
          isAdjustment ? "bg-amber-500/10 text-amber-600" :
          isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
        )}>
          {movement.purchase ? <Truck size={10} /> : isAdjustment ? <RefreshCcw size={10} /> : isPositive ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
          {movement.purchase ? "Achat" : isAdjustment ? "Ajustement" : isPositive ? "Entrée" : "Sortie"}
        </Badge>
      </TableCell>
      <TableCell className={cn("text-right font-black text-lg tracking-tighter", isPositive ? "text-emerald-600" : "text-red-600")}>
        {isPositive ? "+" : ""}{movement.qty}
      </TableCell>
      <TableCell className="text-sm text-slate-500 max-w-xs truncate">{movement.reason ?? '—'}</TableCell>
      <TableCell className="pr-8 text-sm font-medium">{movement.authorName}</TableCell>
    </TableRow>
  );
}
