"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2, Ticket} from "lucide-react";
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
    expiresAt: string;
    maxUses: string;
}

export function AddCouponModal({ onCouponAdded }: AddCouponModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<CouponFormValues>({
        defaultValues: { code: "", amount: "", minAmount: "", expiresAt: "", maxUses: "" },
    });

    useEffect(() => {
        if (open) reset({ code: "", amount: "", minAmount: "", expiresAt: "", maxUses: "" });
    }, [open, reset]);

    const onSubmit = async (data: CouponFormValues) => {
        setLoading(true);
        try {
            await crmApi.createCoupon({
                code: data.code.toUpperCase(),
                amount: Number(data.amount),
                minAmount: data.minAmount ? Number(data.minAmount) : undefined,
                expiresAt: data.expiresAt ? `${data.expiresAt}T23:59:59` : undefined,
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
                        <Input {...register("expiresAt")} type="date" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
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
