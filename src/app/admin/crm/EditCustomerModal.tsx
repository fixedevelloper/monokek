"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Edit3, Loader2, Mail, Phone, UserCircle2} from "lucide-react";
import {toast} from "sonner";
import * as crmApi from "@/src/lib/api/crm";
import {CustomerDto} from "@/src/lib/api/types/crm";
import {AxiosError} from "axios";
import {getErrorMessage} from "@/src/lib/errors";

interface EditCustomerModalProps {
    customer: CustomerDto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerUpdated: () => void;
}

interface EditCustomerFormValues {
    name: string;
    phone: string;
    email: string;
}

export function EditCustomerModal({ customer, open, onOpenChange, onCustomerUpdated }: EditCustomerModalProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<EditCustomerFormValues>({
        defaultValues: { name: customer.name, phone: customer.phone, email: customer.email ?? "" },
    });

    useEffect(() => {
        if (open) reset({ name: customer.name, phone: customer.phone, email: customer.email ?? "" });
    }, [open, customer, reset]);

    const onSubmit = async (data: EditCustomerFormValues) => {
        setLoading(true);
        try {
            await crmApi.updateCustomer(customer.id, {
                name: data.name, phone: data.phone, email: data.email || undefined,
            });
            toast.success(`Fiche de ${data.name} mise à jour`);
            onCustomerUpdated();
            onOpenChange(false);
        } catch (error) {
            const errors = error instanceof AxiosError
                ? error.response?.data?.errors as Record<string, string> | undefined
                : undefined;
            if (errors) {
                Object.values(errors).forEach((msg) => toast.error(String(msg)));
            } else {
                toast.error(getErrorMessage(error, "Erreur lors de la modification"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <Edit3 className="text-primary" /> Modifier <span className="text-primary">Client</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <UserCircle2 size={48} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom complet</Label>
                        <Input {...register("name", { required: true })} className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("phone", { required: true })} className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("email")} type="email" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black shadow-lg transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Sauvegarder les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
