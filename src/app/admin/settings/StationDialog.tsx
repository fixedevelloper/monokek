import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ChefHat, Save, PlusCircle } from "lucide-react";
import { KitchenStation, STATION_TYPES, STATION_TYPE_LABELS, StationType } from "@/src/types/kitchenStation";
import { Branch } from "@/src/types/company";

interface StationFormValues {
    name: string;
    type: StationType;
    branchId: string;
}

interface StationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: StationFormValues) => void;
    initialData?: KitchenStation | null;
    branches: Branch[];
    isPending?: boolean;
}

export const StationDialog = ({ open, onOpenChange, onSubmit, initialData, branches, isPending }: StationDialogProps) => {
    const { register, handleSubmit, watch, setValue, reset } = useForm<StationFormValues>({
        defaultValues: { name: "", type: "KITCHEN", branchId: "" },
    });

    useEffect(() => {
        if (open) {
            reset(initialData
                ? { name: initialData.name, type: initialData.type, branchId: String(initialData.branchId) }
                : { name: "", type: "KITCHEN", branchId: branches[0] ? String(branches[0].id) : "" });
        }
    }, [open, initialData, branches, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden">
                <DialogHeader className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <ChefHat size={28} />
                    </div>
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                        {initialData ? "Modifier la station" : "Nouvelle station"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-slate-400">
                        Le type détermine, entre autres, quelle station alimente l'écran "Comptoir Bar" du POS.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom de la station</Label>
                        <Input
                            {...register("name", { required: true })}
                            placeholder="ex: Bar, Grill, Pâtisserie..."
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 focus-visible:ring-primary font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Type</Label>
                        <Select onValueChange={(v) => setValue("type", v as StationType)} value={watch("type")}>
                            <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                                {STATION_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>{STATION_TYPE_LABELS[type]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                    {initialData ? "Mettre à jour" : "Créer la station"}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
