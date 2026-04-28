"use client";

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Wallet, 
  Download, 
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Badge,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/src/lib/formatCurrency';
import { cn } from '@/lib/utils';
import Link from 'next/link';


export default function ReportsPage() {
  return (
    <div className="p-6 space-y-8 bg-muted/5 min-h-full">
      
      {/* Header avec sélecteur de période */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
    <div className="flex items-center gap-4">
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white shadow-sm hover:bg-slate-100 shrink-0"
            asChild
        >
            <Link href="/admin">
                <ArrowLeft size={20} />
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Analytique</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Performances de la succursale</p>
        </div>
    </div>
    
    <div className="flex items-center gap-3 w-full md:w-auto">
        <Button variant="outline" className="flex-1 md:flex-none font-black text-[10px] uppercase gap-2 h-12 border-none bg-white shadow-sm hover:bg-slate-50 transition-all">
            <CalendarIcon size={14} className="text-primary" /> Ce mois-ci
        </Button>
        <Button className="flex-1 md:flex-none font-black text-[10px] uppercase gap-2 h-12 shadow-xl shadow-primary/20 transition-transform active:scale-95">
            <Download size={14} /> Exporter PDF
        </Button>
    </div>
</div>

      {/* 1. KPIs Principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportStatCard 
          title="Chiffre d'Affaires" 
          value={formatCurrency(2450800)} 
          trend="+14.2%" 
          up={true} 
          icon={<TrendingUp className="text-emerald-500" />} 
        />
        <ReportStatCard 
          title="Commandes" 
          value="842" 
          trend="+5.1%" 
          up={true} 
          icon={<Users className="text-primary" />} 
        />
        <ReportStatCard 
          title="Panier Moyen" 
          value={formatCurrency(2910)} 
          trend="-2.4%" 
          up={false} 
          icon={<Wallet className="text-orange-500" />} 
        />
        <ReportStatCard 
          title="Coût Matières" 
          value="32%" 
          trend="Stable" 
          up={true} 
          icon={<Package className="text-blue-500" />} 
        />
      </div>

      {/* 2. Analyses Détaillées */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl h-12">
          <TabsTrigger value="sales" className="rounded-lg px-6 font-bold uppercase text-xs">Ventes & Flux</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg px-6 font-bold uppercase text-xs">Produits Stars</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-6 font-bold uppercase text-xs">Modes de Paiement</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graphique des ventes (Placeholder pour Recharts) */}
            <Card className="lg:col-span-2 border-none shadow-sm h-[400px] flex flex-col items-center justify-center bg-card">
               <BarChart3 size={48} className="text-muted-foreground/20 mb-4" />
               <p className="text-xs font-bold uppercase text-muted-foreground">Courbe des ventes journalières</p>
            </Card>

            {/* Top 5 Categories */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic">Top Catégories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CategoryProgress label="Grillades" percent={45} color="bg-primary" />
                <CategoryProgress label="Boissons" percent={30} color="bg-emerald-500" />
                <CategoryProgress label="Pizzas" percent={15} color="bg-orange-500" />
                <CategoryProgress label="Entrées" percent={10} color="bg-blue-500" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase italic">Répartition des encaissements</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Cash</p>
                    <p className="text-2xl font-black">{formatCurrency(980300)}</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[40%]" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Orange Money</p>
                    <p className="text-2xl font-black">{formatCurrency(850200)}</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 w-[35%]" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">MTN MoMo</p>
                    <p className="text-2xl font-black">{formatCurrency(620300)}</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-500 w-[25%]" />
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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