import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {Search, Plus, Minus, Calendar, User, Phone, Save, Trash2, ChevronRight} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";
import {useReservationStore} from "../../../store/useReservationStore";

export function ReservationSheet({ open, onOpenChange, categories, reservation = null, onRefresh }: any) {
    const [loading, setLoading] = useState(false);

    // Accès au store Zustand
    const { formData, selectedItems, setField, updateQty, initReservation, getTotal } = useReservationStore();
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

    const toggleCategory = (id: number) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };
    useEffect(() => {
        if (open && categories?.length > 0 && !expandedCategory) {
            setExpandedCategory(categories[0].id);
        }
    }, [open, categories]);
    // On synchronise le store quand la prop reservation change ou à l'ouverture
    useEffect(() => {
        if (open) initReservation(reservation);
    }, [reservation, open]);

    const handleSave = async () => {
        if (!formData.customer_name || !formData.pickup_date || selectedItems.length === 0) {
            return toast.error("Informations manquantes.");
        }

        setLoading(true);
        try {
            const payload = { ...formData, items: selectedItems, total_amount: getTotal() ,order_id:null};
            if (reservation) {
                await api.put(`/api/admin/reservations/${reservation.id}`, payload);
            } else {
                await api.post("/api/admin/reservations", payload);
            }
            toast.success("Opération réussie !");
            onRefresh();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erreur API");
        } finally {
            setLoading(false);
        }
    };
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] p-0 flex flex-col border-none shadow-2xl">
                <SheetHeader className="p-8 pb-4">
                    <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter">
                        {reservation ? "Modifier" : "Nouvelle"} <span className="text-primary text-outline">Réservation</span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-8 h-160">
                    <div className="space-y-8 py-4">
                        {/* SECTION 1 : CLIENT & DATE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Nom du Client</label>
                                <div className="relative">
                                    <Input className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                        placeholder=""
                                        value={formData.customer_name}
                                        onChange={e => setField("customer_name", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Téléphone</label>
                                <div className="relative">
                                    <Input className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                        placeholder=""
                                        value={formData.customer_phone}
                                        onChange={e => setField("customer_phone", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Date et Heure</label>
                                <div className="relative">
                                    <Input  type="datetime-local" className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                        placeholder=""
                                        value={formData.pickup_date}
                                        onChange={e => setField("pickup_date", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Nombre de personnes</label>
                             {/*   <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                       value={formData.guests_count} onChange={e => setFormData({...formData, guests_count: parseInt(e.target.value)})} />*/}
                                <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                       placeholder="Nombre de personnes"
                                    value={formData.guests_count}
                                    onChange={e => setField("guests_count", e.target.value)}
                                />
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        {/* SECTION 2 : SÉLECTION DES PLATS PAR CATÉGORIES */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary italic">Sélection des plats</h3>

                            {categories?.map((cat: any) => {
                                const isOpen = expandedCategory === cat.id;

                                // Calcul du nombre total d'articles sélectionnés dans cette catégorie
                                const countInCat = cat.products?.reduce((acc: number, p: any) => {
                                    const found = selectedItems.find(i => (i.id === p.id || i.product_id === p.id));
                                    return acc + (found ? found.quantity : 0);
                                }, 0);

                                return (
                                    <div key={cat.id} className="space-y-3 bg-slate-50/50 rounded-3xl p-2 transition-all">
                                        {/* Header de la catégorie - CLIQUABLE */}
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(cat.id)}
                                            className="flex items-center justify-between w-full p-3 hover:bg-white rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white' : 'bg-white text-slate-400 border'}`}>
                                                    <ChevronRight size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                                                </div>
                                                <span className={`text-sm font-black uppercase tracking-wider transition-colors ${isOpen ? 'text-primary' : 'text-slate-600'}`}>
                        {cat.name}
                    </span>
                                            </div>

                                            {/* Badge indicateur de sélection */}
                                            {countInCat > 0 && (
                                                <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full animate-in zoom-in">
                                                    {countInCat} SÉLECTIONNÉS
                                                </div>
                                            )}
                                        </button>

                                        {/* Liste des produits - AFFICHAGE CONDITIONNEL */}
                                        {isOpen && (
                                            <div className="grid grid-cols-1 gap-2 px-2 pb-2 animate-in slide-in-from-top-2 duration-300">
                                                {cat.products?.map((prod: any) => {
                                                    const itemInCart = selectedItems.find(i => (i.id === prod.id || i.product_id === prod.id));
                                                    return (
                                                        <div
                                                            key={prod.id}
                                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all shadow-sm ${
                                                                itemInCart ? 'border-primary bg-white ring-4 ring-primary/5' : 'border-white bg-white/50 opacity-80'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black uppercase tracking-tight">{prod.name}</span>
                                                                <span className="text-[11px] font-bold text-primary">{prod.price} FCFA</span>
                                                            </div>

                                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-lg hover:bg-red-100 text-red-500"
                                                                    onClick={(e) => { e.stopPropagation(); updateQty(prod, -1); }}
                                                                >
                                                                    <Minus size={14} strokeWidth={3} />
                                                                </Button>

                                                                <span className="text-sm font-black w-6 text-center">
                                        {itemInCart?.quantity || 0}
                                    </span>

                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-lg hover:bg-emerald-100 text-emerald-500"
                                                                    onClick={(e) => { e.stopPropagation(); updateQty(prod, 1); }}
                                                                >
                                                                    <Plus size={14} strokeWidth={3} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>

                {/* FOOTER : TOTAL + SAVE */}
                <SheetFooter className="p-8 border-t bg-slate-50/50">
                    <div className="w-full space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-black uppercase text-slate-400">Total Réservation</span>
                            <span className="text-2xl font-black text-slate-950">
                {selectedItems.reduce((acc, item) => acc + (item.price || item.unit_price) * item.quantity, 0)} F
              </span>
                        </div>
                        <Button onClick={handleSave} disabled={loading} className="w-full h-16 rounded-[2rem] font-black text-lg gap-3">
                            {loading ? "ENREGISTREMENT..." : (reservation ? "METTRE À JOUR" : "CONFIRMER LA RÉSERVATION")}
                            <Save size={20} />
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}