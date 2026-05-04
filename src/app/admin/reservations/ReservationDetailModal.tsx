import React from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar, Clock, User, Phone,
    Receipt, MapPin, Hash, Printer
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {formatCurrency} from "../../../lib/formatCurrency";
import {toast} from "sonner";

export function ReservationDetailModal({ open, onOpenChange, reservation ,onPayment}: any) {
    if (!reservation) return null;



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                {/* Header avec Statut */}
                <div className="bg-slate-950 p-8 text-white relative">
                    <div className="flex justify-between items-start mb-6">
                        <Badge className="bg-primary text-white border-none font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
                            {reservation.order?.reference || "RÉSERVATION"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                            <Printer size={18} />
                        </Button>
                    </div>

                    <h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter">
                        Détails <br /> <span className="text-primary">Commande</span>
                    </h2>
                </div>

                <div className="p-8 space-y-8">
                    {/* Section Client & Temps */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <User size={12} /> Client
                            </p>
                            <p className="font-black uppercase text-sm text-slate-900">{reservation.customer?.name}</p>
                            <p className="text-xs font-bold text-slate-500">{reservation.customer?.phone}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center justify-end gap-1">
                                <Calendar size={12} /> Date & Heure
                            </p>
                            <p className="font-black text-sm text-slate-900">
                                {format(new Date(reservation.pickup_date), "dd MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-xs font-black text-primary uppercase italic">
                                À {format(new Date(reservation.pickup_date), "HH:mm")}
                            </p>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Liste des Plats */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Articles Commandés</p>
                        <div className="space-y-3">
                            {reservation.order?.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">
                      {item.qty}x
                    </span>
                                        <span className="text-xs font-black uppercase text-slate-700">{item.name || item.product?.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">{ formatCurrency((item.price * item.qty))}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes Manager */}
                    {reservation.manager_notes && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 italic text-amber-700 text-xs">
                            <span className="font-black not-italic uppercase text-[9px] block mb-1">Note du manager :</span>
                            "{reservation.manager_notes}"
                        </div>
                    )}

                    {/* Total */}
                    <div className="bg-slate-950 rounded-[2rem] p-6 flex justify-between items-center shadow-xl shadow-slate-950/20">
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">
                                {['pending_payment', 'paid', 'completed'].includes(reservation.order?.status)
                                    ? 'Suivi de commande'
                                    : 'Total à régler'}
                            </p>
                            <p className="text-2xl font-black text-white italic tracking-tighter">
                                {formatCurrency(reservation.order?.amounts.total)}
                            </p>
                        </div>

                        {['pending_payment', 'paid', 'completed'].includes(reservation.order?.status) ? (
                            <div className="flex flex-col items-end gap-1">
                                <Badge className={`rounded-lg font-black text-[10px] uppercase italic ${
                                    reservation.order?.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}>
                                    {reservation.order?.status === 'paid' ? 'Payé ✓' : 'En attente de caisse...'}
                                </Badge>
                                <span className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">
                Action Manager désactivée
            </span>
                            </div>
                        ) : (
                            <Button
                                className="rounded-xl font-black uppercase italic text-xs tracking-tighter hover:scale-105 transition-transform bg-primary"
                                onClick={() => onPayment(reservation)}
                            >
                                Envoyer en caisse
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}