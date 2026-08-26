"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Edit3, KeyRound, Loader2, Mail, Phone, UserCircle2} from "lucide-react";
import {toast} from "sonner";
import {StaffMember} from "@/src/types/management";
import * as identityApi from "@/src/lib/api/identity";
import {Branch} from "@/src/types/company";
import {AxiosError} from "axios";

interface Role {
    id: number;
    name: string;
}

interface EditStaffModalProps {
    member: StaffMember;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStaffUpdated: () => void;
    branches: Branch[];
    roles: Role[];
}

interface EditStaffFormValues {
    name: string;
    phone: string;
    email: string;
    role: string;
    branchId: string;
    pin: string;
}

const NO_BRANCH = "__none__";

export function EditStaffModal({ member, open, onOpenChange, onStaffUpdated, branches, roles }: EditStaffModalProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue, reset } = useForm<EditStaffFormValues>({
        defaultValues: {
            name: member.name, phone: member.phone ?? "", email: member.email,
            role: member.role, branchId: member.branch_id ? String(member.branch_id) : NO_BRANCH, pin: "",
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: member.name, phone: member.phone ?? "", email: member.email,
                role: member.role, branchId: member.branch_id ? String(member.branch_id) : NO_BRANCH, pin: "",
            });
        }
    }, [open, member, reset]);

    const onSubmit = async (data: EditStaffFormValues) => {
        setLoading(true);
        try {
            await identityApi.updateStaff(member.uuid, {
                name: data.name, email: data.email, phone: data.phone, role: data.role,
                branchId: data.branchId === NO_BRANCH ? null : Number(data.branchId),
                clearBranchId: data.branchId === NO_BRANCH,
            });

            if (data.pin) {
                await identityApi.setStaffPin(member.uuid, data.pin);
            }

            toast.success(`Profil de ${data.name} mis à jour`);
            onStaffUpdated();
            onOpenChange(false);
        } catch (error) {
            const errors = error instanceof AxiosError
                ? error.response?.data?.errors as Record<string, string> | undefined
                : undefined;
            if (errors) {
                Object.values(errors).forEach((msg) => toast.error(String(msg)));
            } else {
                toast.error("Erreur lors de la modification");
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
                        <Edit3 className="text-primary" /> Modifier <span className="text-primary">Staff</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <UserCircle2 size={48} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom complet</Label>
                            <Input {...register("name", { required: true })} className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...register("phone")} className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input {...register("email", { required: true })} type="email" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Rôle au sein de Mono-Kek</Label>
                        <Select onValueChange={(v) => setValue("role", v)} value={watch("role")}>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-100 border-none font-black uppercase text-[11px] tracking-widest">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl font-bold">
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.name} className="capitalize">
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Branche</Label>
                        <Select onValueChange={(v) => setValue("branchId", v)} value={watch("branchId")}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
                                <SelectValue />
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

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Code PIN (pointage)</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                {...register("pin", { pattern: /^\d{4}$/ })}
                                inputMode="numeric" maxLength={4} placeholder="Laisser vide pour ne pas changer"
                                className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold tracking-widest"
                            />
                        </div>
                        <p className="text-[9px] font-bold uppercase text-slate-400 ml-1">4 chiffres — utilisé pour le pointage sur un poste partagé</p>
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
