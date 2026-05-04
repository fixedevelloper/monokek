"use client";

import React, {useEffect, useState} from 'react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Badge,
  Calendar as CalendarIcon,
  Clock,
  Download, FileDown,
  Loader2,
  Package,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {formatCurrency} from '@/src/lib/formatCurrency';
import {cn} from '@/lib/utils';
import Link from 'next/link';
import api from '@/src/lib/axios';
import {formatDateLong} from '@/src/lib/utils';
import {format, subDays} from 'date-fns';
import { useQuery } from "@tanstack/react-query";
import {Progress} from "@/components/ui/progress";
import {Avatar} from "@/components/ui/avatar";
import {fr} from 'date-fns/locale';
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar} from '@/components/ui/calendar';
import {useExport} from "../../../hooks/useExport";



export default function ReportsPage() {
  const { exportToPDF, isExporting } = useExport();

  // 1. État temporaire (le calendrier)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // 2. État appliqué (la requête API)
  const [appliedRange, setAppliedRange] = useState(dateRange);

  // 3. React Query
  const { data: analytics, isLoading, isFetching } = useQuery({
    queryKey: ["analytics", appliedRange.from, appliedRange.to],
    queryFn: async () => {
      const start = format(appliedRange.from, 'yyyy-MM-dd');
      const end = appliedRange.to ? format(appliedRange.to, 'yyyy-MM-dd') : start;
      const res = await api.get(`/api/admin/analytics`, {
        params: { start_date: start, end_date: end }
      });
      return res.data; // On récupère l'objet structuré de l'API
    }
  });

  const handleApply = () => {
    setAppliedRange(dateRange);
  };

  const handleExportAnalytics = () => {
    if (!analytics) return;

    const columns = ["Indicateur", "Valeur"];
    const exportData = [
      ["Chiffre d'Affaires", `${analytics.kpis.total_sales?.toLocaleString()} FCFA`],
      ["Nombre de Commandes", analytics.kpis.orders_count?.toString()],
      ["Panier Moyen", `${analytics.kpis.average_cart?.toLocaleString()} FCFA`],
      ["Produit Top Vente", analytics.top_products[0]?.name || "N/A"],
    ];

    exportToPDF({
      title: "Rapport Analytique Ventes",
      subtitle: `Période du ${format(appliedRange.from, 'dd/MM/yyyy')} au ${format(appliedRange.to || appliedRange.from, 'dd/MM/yyyy')}`,
      filename: "analytics_report",
      columns: columns
    }, exportData);
  };

  // Loader plein écran au premier chargement
  if (isLoading && !isFetching) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
            Analyse des flux financiers...
          </p>
        </div>
    );
  }

  return (
      <div className="p-6 space-y-8 bg-muted/5 min-h-full">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border" asChild>
              <Link href="/admin"><ArrowLeft size={20} /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                Analytique <span className="text-indigo-600">Business</span>
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Succursale : Douala Sud</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white p-1 rounded-2xl shadow-sm border flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="ghost"
                      className="h-10 px-4 justify-start text-left font-black uppercase text-[10px] tracking-widest"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                            <>{format(dateRange.from, "dd MMM", { locale: fr })} - {format(dateRange.to, "dd MMM yyyy", { locale: fr })}</>
                        ) : (format(dateRange.from, "dd MMM yyyy", { locale: fr }))
                    ) : (<span>Choisir une période</span>)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="end">
                  <Calendar
                      initialFocus
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: any) => setDateRange(range)}
                      numberOfMonths={2}
                      locale={fr}
                      className="p-4"
                  />
                  <div className="p-3 border-t border-dashed flex justify-end">
                    <PopoverClose asChild>
                      <Button
                          size="sm"
                          className="rounded-xl font-black uppercase text-[10px] bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleApply}
                      >
                        Appliquer la période
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
                onClick={handleExportAnalytics}
                disabled={isExporting || isFetching}
                variant="outline"
                className="gap-2 rounded-xl border-slate-200 shadow-sm h-12"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown size={18} className="text-indigo-600" />}
              <span className="text-xs font-black uppercase italic">PDF</span>
            </Button>

            {isFetching && (
                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                  <span className="text-[9px] font-black text-indigo-600 uppercase">MàJ...</span>
                </div>
            )}
          </div>
        </div>

        {/* --- SECTION 1 : KPIs --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportStatCard
              title="Chiffre d'Affaires"
              value={formatCurrency(analytics?.kpis.total_sales)}
              trend="+14.2%" up={true} icon={<TrendingUp className="text-emerald-500"/>}
          />
          <ReportStatCard
              title="Commandes"
              value={analytics?.kpis.orders_count.toString()}
              trend="+5.1%" up={true} icon={<Users className="text-indigo-600"/>}
          />
          <ReportStatCard
              title="Panier Moyen"
              value={formatCurrency(analytics?.kpis.average_cart)}
              trend="-2.4%" up={false} icon={<Wallet className="text-orange-500"/>}
          />
          <ReportStatCard
              title="Coût Matières"
              value={`${analytics?.kpis.food_cost}%`}
              trend="Stable" up={true} icon={<Package className="text-blue-500"/>}
          />
        </div>

        {/* --- SECTION 2 : GRAPHIQUES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm p-6 bg-white rounded-3xl">
            <h3 className="text-xs font-black uppercase mb-6 text-slate-400 tracking-widest">Évolution des recettes</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <AreaChart data={analytics?.chart_data}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd MMM', {locale: fr})} fontSize={10} />
                  <Tooltip
                      formatter={(v: any) => [formatCurrency(v), "Recette"]}
                      contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="url(#colorTotal)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-none shadow-sm p-6 bg-white rounded-3xl">
            <h3 className="text-xs font-black uppercase mb-6 text-slate-400 tracking-widest flex items-center gap-2">
              <Clock size={14} /> Heures de pointe
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={analytics?.hourly_flow}>
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} fontSize={10} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* --- SECTION 3 : ÉQUIPE & PAIEMENTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm p-6 bg-white rounded-3xl">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-black uppercase italic">Performance Serveurs</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              {analytics?.waiters.map((waiter: any) => (
                  <div key={waiter.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xs">
                          {waiter.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="text-xs font-black uppercase">{waiter.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold">{waiter.orders} commandes</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-indigo-600">{formatCurrency(waiter.sales)}</p>
                    </div>
                    <Progress value={(waiter.sales / analytics.kpis.total_sales) * 100} className="h-1.5" />
                  </div>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-sm p-6 bg-white rounded-3xl">
            <CardHeader className="px-0 pt-0 text-center">
              <CardTitle className="text-sm font-black uppercase italic">Modes d'encaissement</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4 h-full content-center">
              {analytics?.payments.map((p: any) => (
                  <div key={p.method_name} className="p-6 rounded-3xl bg-indigo-50/30 border border-dashed border-indigo-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">{p.method_name}</span>
                    <span className="text-xl font-black text-slate-800">{formatCurrency(p.total)}</span>
                  </div>
              ))}
            </div>
          </Card>
        </div>

        {/* --- SECTION 4 : PRODUITS STARS --- */}
        <Card className="border-none shadow-sm p-6 bg-white rounded-3xl">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <Package size={16} className="text-indigo-600" /> Top 5 Produits
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics?.top_products.map((product: any, index: number) => (
                <div key={product.name} className="relative p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-indigo-100 transition-all">
                  <span className="absolute top-2 right-3 text-2xl font-black text-slate-200">#{index + 1}</span>
                  <p className="text-[11px] font-black uppercase truncate pr-6">{product.name}</p>
                  <div className="mt-4">
                    <p className="text-2xl font-black leading-none">{product.qty}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Unités</p>
                  </div>
                </div>
            ))}
          </div>
        </Card>
      </div>
  );
}

// Composants internes utilitaires
function ReportStatCard({ title, value, trend, up, icon }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-xl bg-muted/50">{icon}</div>
          <Badge className={cn(
            "text-[10px] font-black px-2 py-0.5",
            up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {up ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
            {trend}
          </Badge>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black mt-1 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryProgress({ label, percent, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}