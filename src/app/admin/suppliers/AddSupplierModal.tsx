"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2, Mail, MapPin, Phone, Truck, UserCircle2} from "lucide-react";
import {toast} from "sonner";
import * as suppliersApi from "@/src/lib/api/suppliers";
import {AxiosError} from "axios";
import {getErrorMessage} from "@/src/lib/errors";

interface AddSupplierModalProps {
    onSupplierAdded: () => void;
}

interface SupplierFormValues {
    name: string;
    phone: string;
    email: string;
    address: string;
    contactName: string;
}

export function AddSupplierModal({ onSupplierAdded }: AddSupplierModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<SupplierFormValues>({
        defaultValues: { name: "", phone: "", email: "", address: "", contactName: "" },
    });

    useEffect(() => {
        if (open) reset({ name: "", phone: "", email: "", address: "", contactName: "" });
    }, [open, reset]);

    const onSubmit = async (data: SupplierFormValues) => {
        setLoading(true);
        try {
            await suppliersApi.createSupplier({
                name: data.name,
                phone: data.phone || undefined,
                email: data.email || undefined,
                address: data.address || undefined,
                contactName: data.contactName || undefined,
            });
            toast.success(`Fiche de ${data.name} créée !`);
            setOpen(false);
            onSupplierAdded();
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
                    <Truck size={18} /> Nouveau fournisseur
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <Truck className="text-primary" /> Nouvelle <span className="text-primary">Fiche</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom du fournisseur</Label>
                        <Input {...register("name", { required: true })} placeholder="Ex: Metro Cash & Carry" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Contact principal</Label>
                        <div className="relative">
                            <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("contactName")} placeholder="Ex: Jean Dupont" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("phone")} placeholder="6xx xxx xxx" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("email")} type="email" placeholder="email@exemple.com" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("address")} placeholder="Adresse postale" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Créer la fiche fournisseur"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
