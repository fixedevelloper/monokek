"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Search, Loader2, ArrowLeft, Minus, History, AlertCircle } from 'lucide-react';
import { useStockStore } from "@/src/store/use-stock-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddIngredientModal } from './AddIngredientModal';
import { cn } from '@/src/lib/utils';
import { AdjustStockModal } from './AdjustStockModal';

export default function StockPage() {
  const { ingredients, isLoading, fetchIngredients, fetchUnits } = useStockStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  useEffect(() => {
    fetchIngredients();
    fetchUnits();
  }, []);

  const filteredItems = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const handleOpenAdjust = (item: any, type: 'in' | 'out') => {
    setSelectedItem(item);
    setAdjustType(type);
    setIsAdjustModalOpen(true);
  };
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* BOUTON RETOUR */}
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="rounded-xl hover:bg-slate-100 p-2 transition-all active:scale-95"
          >
            <ArrowLeft size={28} className="text-slate-900" />
          </Button>

          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Stock
          </h1>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-2xl gap-2 h-12 px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus size={20} />
          <span className="font-bold uppercase tracking-tight">Ajouter</span>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-12 h-12 rounded-xl border-none bg-slate-50"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-12 w-12" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <IngredientCard
              key={item.id}
              item={item}
              onAdjust={handleOpenAdjust}
            />
          ))}
        </div>
      )}

      <AddIngredientModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <AdjustStockModal
        open={isAdjustModalOpen}
        onOpenChange={setIsAdjustModalOpen} // <-- C'était ici l'erreur !
        item={selectedItem}
        type={adjustType}
      />
    </div>
  );
}

function IngredientCard({ item, onAdjust }: { item: any, onAdjust: (item: any, type: 'in' | 'out') => void }) {
  const isLowStock = item.stock <= item.alert_qty;

  // Formater l'unité (soit objet, soit string selon ton API)
  const unitName = typeof item.unit === 'object' ? item.unit.name : (item.unit || 'pcs');

  return (
    <div className={cn(
      "relative bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 group shadow-sm",
      isLowStock ? "border-red-100 bg-red-50/10 shadow-red-100" : "border-slate-100 hover:border-primary/20"
    )}>

      {/* BADGE ÉTAT CRITIQUE */}
      {isLowStock && (
        <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
          <AlertCircle size={12} /> STOCK BAS
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl tracking-tight text-slate-800">{item.name}</h3>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
            Ref: {item.id}
          </span>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm",
          isLowStock ? "bg-red-500 text-white" : "bg-slate-900 text-white"
        )}>
          {unitName}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className={cn(
          "text-5xl font-black italic tracking-tighter",
          isLowStock ? "text-red-600" : "text-slate-900"
        )}>
          {parseFloat(item.stock).toLocaleString()}
        </span>
        <span className="text-sm font-bold text-slate-400 uppercase">{unitName}</span>
      </div>

      {/* JAUGE DE PROGRESSION */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out",
            isLowStock ? "bg-red-500" : "bg-emerald-500"
          )}
          style={{ width: `${Math.min((item.stock / (item.alert_qty * 3)) * 100, 100)}%` }}
        />
      </div>

      {/* ZONE D'ACTIONS */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => onAdjust(item, 'in')}
          className="rounded-2xl h-12 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-none transition-all font-black text-xs"
        >
          <Plus size={18} strokeWidth={3} />
        </Button>

        <Button
          onClick={() => onAdjust(item, 'out')}
          className="rounded-2xl h-12 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border-none transition-all font-black text-xs"
        >
          <Minus size={18} strokeWidth={3} />
        </Button>

        <Button
          variant="outline"
          className="rounded-2xl h-12 border-2 border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          onClick={() => window.location.href = `/admin/stock/history?ingredient_id=${item.id}`}
        >
          <History size={18} />
        </Button>
      </div>

      <div className="mt-4 flex justify-between items-center opacity-40">
        <span className="text-[9px] font-black uppercase tracking-widest">Alerte à {item.alert_qty}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-right">Mise à jour: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}