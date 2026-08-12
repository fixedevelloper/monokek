"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Loader2, Lock, Mail, Phone, UserPlus} from "lucide-react";
import {toast} from "sonner";
import * as identityApi from "@/src/lib/api/identity";
import {Branch} from "@/src/types/company";
import {AxiosError} from "axios";
import {getErrorMessage} from "@/src/lib/errors";

interface Role {
    id: number;
    name: string;
}

interface AddStaffModalProps {
    onStaffAdded: () => void;
    branches: Branch[];
    roles: Role[];
}

interface StaffFormValues {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: string;
    branchId: string;
}

const NO_BRANCH = "__none__";

export function AddStaffModal({ onStaffAdded, branches, roles }: AddStaffModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue, reset } = useForm<StaffFormValues>({
        defaultValues: { name: "", phone: "", email: "", password: "", role: "", branchId: NO_BRANCH },
    });

    useEffect(() => {
        if (open) {
            reset({ name: "", phone: "", email: "", password: "", role: roles[0]?.name ?? "", branchId: NO_BRANCH });
        }
    }, [open, roles, reset]);

    const onSubmit = async (data: StaffFormValues) => {
        setLoading(true);
        try {
            await identityApi.createStaff({
                name: data.name, email: data.email, phone: data.phone, password: data.password, role: data.role,
                branchId: data.branchId === NO_BRANCH ? null : Number(data.branchId),
            });

            toast.success(`Le compte de ${data.name} a été créé !`);
            setOpen(false);
            onStaffAdded();
        } catch (error) {
            const errors = error instanceof AxiosError
                ? error.response?.data?.errors as Record<string, string> | undefined
                : undefined;
            // Gestion propre des erreurs de validation (Spring: {field: "message"})
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
                    <UserPlus size={18} /> Inviter
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <UserPlus className="text-primary" /> Nouveau <span className="text-primary">Membre</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom complet</Label>
                            <Input {...register("name", { required: true })} placeholder="Ex: Jean Dupont" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...register("phone")} placeholder="6xx xxx xxx" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("email", { required: true })} type="email" placeholder="email@monokek.com" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Rôle Système</Label>
                            <Select onValueChange={(v) => setValue("role", v)} value={watch("role")}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
                                    <SelectValue placeholder="Chargement..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={role.name}
                                            className="font-bold capitalize"
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Pass provisoire</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...register("password", { required: true, minLength: 8 })} type="password" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Branche</Label>
                        <Select onValueChange={(v) => setValue("branchId", v)} value={watch("branchId")}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
                                <SelectValue placeholder="Aucune (accès toutes branches)" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                <SelectItem value={NO_BRANCH} className="font-bold">Aucune (accès toutes branches)</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)} className="font-bold">
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Créer le compte staff"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
