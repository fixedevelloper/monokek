import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Save, PlusCircle } from "lucide-react";
import { CashRegister } from "@/src/types/cashier";
import { Branch } from "@/src/types/company";

interface RegisterFormValues {
    name: string;
    branchId: string;
}

interface RegisterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: RegisterFormValues) => void;
    initialData?: CashRegister | null;
    branches: Branch[];
    isPending?: boolean;
}

export const RegisterDialog = ({ open, onOpenChange, onSubmit, initialData, branches, isPending }: RegisterDialogProps) => {
    const { register, handleSubmit, watch, setValue, reset } = useForm<RegisterFormValues>({
        defaultValues: { name: "", branchId: "" },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: initialData?.name ?? "",
                branchId: initialData ? String(initialData.branch_id) : (branches[0] ? String(branches[0].id) : ""),
            });
        }
    }, [open, initialData, branches, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden">
                <DialogHeader className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <CreditCard size={28} />
                    </div>
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                        {initialData ? "Modifier la caisse" : "Nouvelle caisse"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-slate-400">
                        Un poste d'encaissement physique, sélectionnable depuis le terminal POS.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom de la caisse</Label>
                        <Input
                            {...register("name", { required: true })}
                            placeholder="ex: Caisse 1, Comptoir Entrée..."
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 focus-visible:ring-primary font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Succursale</Label>
                        <Select onValueChange={(v) => setValue("branchId", v)} value={watch("branchId")} disabled={!!initialData}>
                            <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                <SelectValue placeholder="Choisir une succursale" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {initialData && (
                            <p className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                                La succursale ne peut pas être changée après création.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-[1.5rem] h-14 font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isPending ? "Traitement..." : (
                                <span className="flex items-center gap-2">
                                    {initialData ? <Save size={18} /> : <PlusCircle size={18} />}
                                    {initialData ? "Mettre à jour" : "Créer la caisse"}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
