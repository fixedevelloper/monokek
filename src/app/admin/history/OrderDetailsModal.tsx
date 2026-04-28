"use client";

import { 
  X, Printer, Download, Utensils, 
  User, Calendar, Hash, CreditCard 
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/src/types/menus";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' })
      .format(amount).replace('FCFA', '').trim() + ' FCFA';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* max-w-5xl permet d'avoir une largeur confortable pour les détails complexes */}
     <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-950">
        
        {/* Header étendu */}
        <div className="bg-slate-900 p-10 text-white relative">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="absolute right-6 top-6 text-slate-400 hover:text-white rounded-full h-12 w-12"
          >
            <X size={24} />
          </Button>

          <div className="flex justify-between items-center">
            <div className="flex gap-6 items-center">
              <div className="h-20 w-20 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                <Hash size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Badge className="bg-primary text-white border-none font-black uppercase text-[10px] tracking-widest px-3">
                    {order.status}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {order.date} • {order.created_at}
                  </span>
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  {order.reference}
                </h2>
              </div>
            </div>
            
            <div className="text-right bg-white/5 p-4 rounded-3xl border border-white/10 px-8">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1">Table</p>
              <p className="text-4xl font-black text-primary italic tracking-tighter">
                {order.table?.name || "LIVRAISON"}
              </p>
            </div>
          </div>
        </div>

        {/* Corps en 2 colonnes sur écran large */}
        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Colonne GAUCHE : Articles (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary italic">Détail de la commande</h3>
              <Badge variant="outline" className="rounded-full font-bold opacity-50">
                {order.items?.length} Articles
              </Badge>
            </div>
            
            <ScrollArea className="h-[450px] pr-6">
              <div className="space-y-6">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary">
                        {item.qty}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase leading-tight">{item.product.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.modifiers?.map((mod, i) => (
                            <Badge key={i} className="bg-orange-500/10 text-orange-600 border-none text-[9px] font-bold">+ {mod.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-sm tracking-tighter">
                        {new Intl.NumberFormat('fr-CM').format(item.total)} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Colonne DROITE : Info Serveur & Paiement (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Informations</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center"><User size={18}/></div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-50">Serveur</p>
                      <p className="text-sm font-bold">{order.waiter?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center"><Calendar size={18}/></div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-50">Étage</p>
                      <p className="text-sm font-bold">{order.table?.floor_name || 'Rez-de-chaussée'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Résumé Financier */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Sous-total</span>
                  <span>{new Intl.NumberFormat('fr-CM').format(order.amounts.subtotal)} FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="font-black uppercase italic text-lg tracking-tighter">Total</span>
                  <span className="text-4xl font-black text-primary tracking-tighter italic leading-none">
                    {order.amounts.formatted_total}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <Button className="h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-slate-900/10">
                  <Printer size={20} /> Imprimer Reçu
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2">
                  <Download size={18} /> Télécharger PDF
                </Button>
              </div>
            </div>

            {order.note && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border-l-4 border-orange-500">
                    <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Note du serveur</p>
                    <p className="text-sm italic font-medium">"{order.note}"</p>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}