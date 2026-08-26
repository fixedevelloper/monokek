"use client";

import React, {useState} from "react";
import {ArrowLeft, Download, Eye, FilterX, Loader2, Search} from "lucide-react";
import {format, subDays} from "date-fns";
import {toast} from "sonner";
import Link from "next/link";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import * as orderingApi from "@/src/lib/api/ordering";
import * as companyApi from "@/src/lib/api/company";
import {Order} from "@/src/types/menus";
import {Branch} from "@/src/types/company";
import {OrderDetailsModal} from "./OrderDetailsModal";

import {useQuery} from "@tanstack/react-query";
import {DateRangePicker} from "../../../../components/ui/date-range-picker";
import {DateRange} from "react-day-picker";

// Interface basée sur ton OrderResource
interface OrderHistoryItem {
  id: number;
  reference: string;
  table_name: string;
  waiter_name: string;
  payment_method: string;
  total: number;
  status: string;
  created_at: string;
  time: string;
  date_formatted: string;
}

// "completed" est le statut "servi mais pas payé" — voir Order.applyKitchenRoundStatus côté
// backend, aucune commande n'y reste jamais automatiquement plus loin sans un finalize/cancel.
const STATUS_FILTERS = [
  { value: "all", label: "Tous les statuts" },
  { value: "completed", label: "En attente de paiement" },
  { value: "paid", label: "Payées" },
  { value: "cancelled", label: "Annulées" },
] as const;

export default function AdminHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [appliedRange, setAppliedRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Onglet de branche actif — chaque branche a son propre historique de ventes.
  const { data: branches = [] } = useQuery({
    queryKey: ['branches-for-history'],
    queryFn: () => companyApi.listBranches(),
  });
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
  React.useEffect(() => {
    if (branches.length === 0) return;
    if (!branches.some((b: Branch) => b.id === activeBranchId)) {
      setActiveBranchId(branches[0].id);
    }
  }, [branches, activeBranchId]);

  // 2. Utilisation de useQuery
  const { data: orders = [], isLoading, isFetching } = useQuery({
    queryKey: ['orders-history', searchQuery, statusFilter, appliedRange.from, appliedRange.to, activeBranchId],
    queryFn: () => orderingApi.historyAdmin({
      search: searchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      startDate: appliedRange.from
          ? format(appliedRange.from, 'yyyy-MM-dd')
          : undefined,
      endDate: appliedRange.to
          ? format(appliedRange.to, 'yyyy-MM-dd')
          : appliedRange.from
              ? format(appliedRange.from, 'yyyy-MM-dd')
              : undefined,
      branchId: activeBranchId ?? undefined,
    }),
    enabled: activeBranchId !== null,
   // keepPreviousData: true
  });

  const handleDateChange = (newRange?: DateRange) => {
    if (!newRange) return;

    setAppliedRange(newRange);
  };

  // Réutilise exactement les filtres actuellement appliqués à l'écran, pour que le fichier
  // exporté corresponde toujours à ce que l'admin voit dans le tableau.
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await orderingApi.exportHistoryAdmin({
        search: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        startDate: appliedRange.from ? format(appliedRange.from, 'yyyy-MM-dd') : undefined,
        endDate: appliedRange.to
            ? format(appliedRange.to, 'yyyy-MM-dd')
            : appliedRange.from
                ? format(appliedRange.from, 'yyyy-MM-dd')
                : undefined,
        branchId: activeBranchId ?? undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historique_commandes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Export Excel généré avec succès");
    } catch (error) {
      console.error("Erreur d'export de l'historique:", error);
      toast.error("Échec de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };
  // 3. Fonction d'impression Ticket PDF (Format 80mm)

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('paid') || s.includes('payé')) {
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none uppercase text-[9px] font-black tracking-widest">Payé</Badge>;
    }
    if (s.includes('cancel') || s.includes('annulé')) {
        return <Badge className="bg-red-500/10 text-red-600 border-none uppercase text-[9px] font-black tracking-widest">Annulé</Badge>;
    }
    if (s === 'completed') {
        return <Badge className="bg-orange-500/10 text-orange-600 border-none uppercase text-[9px] font-black tracking-widest">Attente paiement</Badge>;
    }
    return <Badge variant="secondary" className="uppercase text-[9px] font-black tracking-widest">{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(amount).replace('FCFA', '').trim() + ' FCFA';
  };
  const handleViewDetails = async (order: Order) => {
    try {

      setSelectedOrder(order);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Impossible de charger les détails");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100">
                <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Historique des <span className="text-primary">Ventes</span></h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Archives des transactions</p>
          </div>
        </div>

        {/* --- ONGLETS DE BRANCHE --- */}
        {branches.length > 1 && activeBranchId !== null && (
            <Tabs value={String(activeBranchId)} onValueChange={(v) => setActiveBranchId(Number(v))} className="mb-4">
              <TabsList>
                {branches.map((branch: Branch) => (
                    <TabsTrigger key={branch.id} value={String(branch.id)} className="text-xs font-bold uppercase px-4">
                      {branch.name}
                    </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="N° Commande..."
                  className="pl-10 h-11 w-64 rounded-xl bg-slate-50 border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Range Date Picker (Utilise ton composant Popover + Calendar précédent) */}
            <DateRangePicker
                initialRange={appliedRange}
                onApply={handleDateChange}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-56 rounded-xl bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              variant="outline"
              className="h-12 rounded-2xl border-none bg-white shadow-sm gap-2 font-bold uppercase text-[10px] hover:bg-primary hover:text-white transition-all">
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exporter Excel
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="border-none">
                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8">Ref</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Heure</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Table</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Serveur</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Caissier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Total</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Statut</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <Loader2 className="animate-spin" />
                            <span className="text-[10px] font-black uppercase">Récupération des données...</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : orders?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-20 italic">
                            <FilterX size={48} />
                            <span className="text-[10px] font-black uppercase">Aucune vente trouvée</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : (
                orders?.map((order:Order) => (
                    <TableRow key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                      <TableCell className="font-bold pl-8 py-5 tracking-tighter">{order.reference}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">
                        {order.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg font-bold border-2">{order.table?.name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{order.waiter?.name}</TableCell>
                      <TableCell className="font-medium text-sm">{order.cashier?.name}</TableCell>
                      <TableCell className="text-right font-black text-lg tracking-tighter">
                        {formatCurrency(order.amounts.total)}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                          onClick={() => handleViewDetails(order)}
                           size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                            <Eye size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
      <OrderDetailsModal 
  order={selectedOrder} 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
/>
    </div>
  );
}