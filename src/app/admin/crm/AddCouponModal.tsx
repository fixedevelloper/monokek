"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Calendar as CalendarIcon, Loader2, Ticket, X} from "lucide-react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {toast} from "sonner";
import * as crmApi from "@/src/lib/api/crm";
import {AxiosError} from "axios";
import {getErrorMessage} from "@/src/lib/errors";

interface AddCouponModalProps {
    onCouponAdded: () => void;
}

interface CouponFormValues {
    code: string;
    amount: string;
    minAmount: string;
    maxUses: string;
}

export function AddCouponModal({ onCouponAdded }: AddCouponModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    // Date choisie dans le calendrier (et non un <input type="date"> natif, peu fiable dans la webview Linux de Tauri).
    const [expiresAt, setExpiresAt] = useState<Date | undefined>();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm<CouponFormValues>({
        defaultValues: { code: "", amount: "", minAmount: "", maxUses: "" },
    });

    useEffect(() => {
        if (open) {
            reset({ code: "", amount: "", minAmount: "", maxUses: "" });
            setExpiresAt(undefined);
            setCalendarOpen(false);
        }
    }, [open, reset]);

    const onSubmit = async (data: CouponFormValues) => {
        setLoading(true);
        try {
            await crmApi.createCoupon({
                code: data.code.toUpperCase(),
                amount: Number(data.amount),
                minAmount: data.minAmount ? Number(data.minAmount) : undefined,
                // Fin de journée, en date locale (toISOString décalerait le jour selon le fuseau).
                expiresAt: expiresAt ? `${format(expiresAt, "yyyy-MM-dd")}T23:59:59` : undefined,
                maxUses: data.maxUses ? Number(data.maxUses) : undefined,
            });
            toast.success(`Coupon ${data.code.toUpperCase()} créé !`);
            setOpen(false);
            onCouponAdded();
        } catch (error) {
            const errors = error instanceof AxiosError
                ? error.response?.data?.errors as Record<string, string> | undefined
                : undefined;
            if (errors) {
                Object.values(errors).forEach((msg) => toast.error(String(msg)));
            } else {
                toast.error(getErrorMessage(error, "Erreur lors de la création"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] gap-2 shadow-xl shadow-primary/20">
                    <Ticket size={18} /> Nouveau coupon
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <Ticket className="text-primary" /> Nouveau <span className="text-primary">Coupon</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Code</Label>
                        <Input {...register("code", { required: true })} placeholder="Ex: BIENVENUE10" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold uppercase" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Montant (FCFA)</Label>
                        <Input {...register("amount", { required: true, min: 0.01 })} type="number" step="0.01" placeholder="1000" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Montant min. commande (optionnel)</Label>
                            <Input {...register("minAmount", { min: 0 })} type="number" step="0.01" placeholder="Aucun minimum" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Utilisations max. (optionnel)</Label>
                            <Input {...register("maxUses", { min: 1 })} type="number" step="1" placeholder="Illimité" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Date d'expiration (optionnel)</Label>
                        <div className="flex gap-2">
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="h-12 flex-1 justify-start rounded-2xl bg-slate-50 border-none px-4 font-bold">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {expiresAt ? format(expiresAt, "PPP", {locale: fr}) : <span className="text-slate-400">Sans date d'expiration</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        locale={fr}
                                        selected={expiresAt}
                                        onSelect={(d) => { setExpiresAt(d); setCalendarOpen(false); }}
                                        disabled={{ before: new Date() }}
                                        autoFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {expiresAt && (
                                <Button type="button" variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => setExpiresAt(undefined)} aria-label="Effacer la date">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Créer le coupon"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
