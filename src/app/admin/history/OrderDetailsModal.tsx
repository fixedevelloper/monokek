import React from "react";
import {
  Dialog, DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  X, Printer, Hash, User, User2,
  Calendar, Download, Clock
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Interfaces ---
interface OrderDetailsModalProps {
  order: any; // Idéalement, utilise ton interface Order
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount).replace('FCFA', '').trim() + ' FCFA';
  };

  const printTicket = (order: any) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 200] });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header du ticket
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MON RESTO", pageWidth / 2, 10, { align: "center" });
    doc.setFontSize(8);
    doc.text(`REF: ${order.reference}`, pageWidth / 2, 15, { align: "center" });

    // On aplatit les rounds pour avoir une liste unique d'articles
    const allItems = order.rounds?.flatMap((r: any) => r.items || []) || [];

    autoTable(doc, {
      startY: 25,
      margin: { left: 2, right: 2 },
      head: [['Qté', 'Désignation', 'Total']],
      body: allItems.map((i: any) => [
        i.qty,
        i.product.name,
        i.total
      ]),
      styles: { fontSize: 7, cellPadding: 1 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`TOTAL: ${order.amounts.total} FCFA`, pageWidth - 5, finalY, { align: "right" });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-950">

          {/* --- HEADER --- */}
          <div className="bg-slate-900 p-8 text-white relative">
            <Button
                variant="ghost"
                onClick={onClose}
                className="absolute right-6 top-6 text-slate-400 hover:text-white rounded-full h-12 w-12"
            >
              <X size={24} />
            </Button>

            <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="flex gap-6 items-center">
                <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                  <Hash size={28} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge className="bg-primary text-white border-none font-black uppercase text-[10px] tracking-tighter">
                      {order.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {order.date} • {order.created_at}
                                    </span>
                  </div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    {order.reference}
                  </h2>
                </div>
              </div>

              <div className="text-right bg-white/5 p-4 rounded-2xl border border-white/10 px-6">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Table / Emplacement</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">
                  {order.table?.name || "LIVRAISON"}
                </p>
              </div>
            </div>
          </div>

          {/* --- CORPS --- */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Colonne GAUCHE : Timeline des Rounds */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Historique des envois (Rounds)
                </h3>
              </div>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-8 ml-2">
                  {order.rounds?.map((round: any, idx: number) => (
                      <div key={round.id || idx} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800">
                        {/* Point sur la timeline */}
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-slate-50 dark:border-slate-950 shadow-sm" />

                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                                <span className="font-black text-[10px] uppercase text-primary">
                                                    Round #{round.round_number}
                                                </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 italic">
                                                {round.sent_at_formatted || 'Envoyé'}
                                            </span>
                        </div>

                        <div className="grid gap-3">
                          {round.items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                                <div className="flex gap-4 items-center">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-xs text-primary">
                                    {item.qty}
                                  </div>
                                  <div>
                                    <p className="font-black text-sm uppercase leading-tight tracking-tight">{item.product.name}</p>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {item.modifiers.map((mod: any, i: number) => (
                                              <span key={i} className="text-[9px] font-bold text-orange-500 uppercase">
                                                                            + {mod.modifier_item?.name || mod.name}
                                                                        </span>
                                          ))}
                                        </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-sm tracking-tighter">
                                    {new Intl.NumberFormat('fr-CM').format(item.total)} F
                                  </p>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Colonne DROITE : Informations & Totaux */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel & Lieu</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm"><User size={18} className="text-primary"/></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400">Serveur</p>
                        <p className="text-sm font-bold tracking-tight">{order.waiter?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm"><User2 size={18} className="text-primary"/></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400">Caissier</p>
                        <p className="text-sm font-bold tracking-tight">{order.cashier?.name || 'En attente'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Sous-total</span>
                    <span className="font-bold text-sm">{new Intl.NumberFormat('fr-CM').format(order.amounts.subtotal)} F</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="font-black uppercase italic text-xl tracking-tighter">Total Net</span>
                    <span className="text-4xl font-black text-primary tracking-tighter italic leading-none">
                                        {order.amounts.formatted_total}
                                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <Button
                      onClick={() => printTicket(order)}
                      className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[11px] tracking-[0.15em] gap-3 shadow-xl transition-all active:scale-95"
                  >
                    <Printer size={20} /> Imprimer le Ticket
                  </Button>
                  <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <Download size={18} /> Télécharger
                  </Button>
                </div>
              </div>

              {/* Note de commande */}
              {order.note && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-[2rem] border-l-4 border-orange-500">
                    <p className="text-[9px] font-black uppercase text-orange-600 mb-1 tracking-widest">Note de cuisine</p>
                    <p className="text-sm italic font-medium leading-relaxed text-orange-900 dark:text-orange-200">
                      "{order.note}"
                    </p>
                  </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}