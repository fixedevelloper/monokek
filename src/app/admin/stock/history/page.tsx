"use client";

import React, { useEffect, useState } from 'react';
import { Search, Calendar, Filter, FileText, ArrowLeft, Loader2, RefreshCcw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStockStore } from "@/src/store/use-stock-store";
import { useRouter } from "next/navigation";
import { StockMovement } from '@/src/types/stock';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StockHistoryPage() {
  const router = useRouter();
  const { movements, isLoading, fetchMovements } = useStockStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMovements();
  }, []);

  // Filtrage local (nom de l'ingrédient ou raison)
  const filteredMovements = movements.filter(m => 
    m.reason?.toLowerCase().includes(search.toLowerCase()) || 
    m.ingredient?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* HEADER AVEC BOUTON BACK */}
      <div className="flex justify-between items-center">
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
              Flux de <span className="text-primary">Stock</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Traçabilité complète des inventaires.</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-2xl border-2 font-black uppercase tracking-widest gap-2 h-14 px-6">
          <FileText className="h-5 w-5" /> Exporter
        </Button>
      </div>

      {/* RECHERCHE */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtrer par ingrédient ou raison..." 
            className="pl-12 h-12 rounded-xl border-none bg-slate-50 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LISTE OU LOADER */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
            <p className="font-black italic uppercase text-slate-400 animate-pulse">Chargement des flux...</p>
          </div>
        ) : filteredMovements.length > 0 ? (
          filteredMovements.map((m) => (
            <MovementRow key={m.id} movement={m} />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
            <p className="text-slate-400 font-bold italic">Aucun mouvement trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
/** Composant de ligne de mouvement */
function MovementRow({ movement }: { movement: StockMovement }) {
  const isPositive = movement.type === 'in' || (movement.type === 'adjust' && movement.qty > 0);
  const isAdjustment = movement.type === 'adjust';

  return (
    <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-center p-4 gap-6">
          
          {/* Icône de Direction */}
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
            isAdjustment ? "bg-amber-100 text-amber-600" : 
            isPositive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          )}>
            {isAdjustment ? <RefreshCcw size={24} /> : 
             isPositive ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
          </div>

          {/* Détails de l'ingrédient */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg uppercase tracking-tight text-slate-800 italic">
                #{movement.ingredient.name}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">
                {movement.type}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{movement.reason}</p>
          </div>

          {/* Date et Heure */}
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700">
              {new Date(movement.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              {new Date(movement.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Quantité */}
          <div className={cn(
            "w-32 text-right text-2xl font-black italic tracking-tighter pr-4",
            isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            {isPositive ? "+" : "-"}{Math.abs(movement.qty)}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}