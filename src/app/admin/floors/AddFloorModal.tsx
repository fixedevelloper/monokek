"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Layers, Loader2, Plus} from "lucide-react";
import {toast} from "sonner";
import * as floorplanApi from "@/src/lib/api/floorplan";
import {Branch} from "@/src/types/company";
import {getErrorMessage} from "@/src/lib/errors";

interface AddFloorModalProps {
    onSuccess: () => void;
    branches: Branch[];
}

interface FloorFormValues {
    name: string;
    branchId: string;
}

export function AddFloorModal({ onSuccess, branches }: AddFloorModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue, reset } = useForm<FloorFormValues>({
        defaultValues: { name: "", branchId: "" },
    });

    useEffect(() => {
        if (open) {
            reset({ name: "", branchId: branches[0] ? String(branches[0].id) : "" });
        }
    }, [open, branches, reset]);

    const onSubmit = async (data: FloorFormValues) => {
        if (!data.branchId) {
            toast.error("Choisissez une succursale.");
            return;
        }
        setLoading(true);

        try {
            await floorplanApi.createFloor({ branchId: Number(data.branchId), name: data.name });

            toast.success(`Zone "${data.name}" créée avec succès`);
            setOpen(false);
            onSuccess(); // Rafraîchir la liste des étages
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la création de l'étage"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl bg-stone-900 text-white font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-stone-200 transition-all hover:bg-stone-800 active:scale-95">
                    <Plus className="mr-2 h-5 w-5" /> Créer une zone
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-stone-900">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Layers size={20} />
                        </div>
                        Nouvelle <span className="text-orange-600">Zone</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-stone-400">
                            Nom de l'espace
                        </Label>
                        <Input
                            {...register("name", { required: true })}
                            placeholder="Ex: Terrasse Vue Mer, Salon Privé..."
                            className="h-14 rounded-2xl bg-stone-50 border-none px-5 font-bold text-stone-800 placeholder:text-stone-300 focus-visible:ring-2 focus-visible:ring-orange-500/20"
                            autoFocus
                        />
                        <p className="text-[10px] text-stone-400 italic ml-1">
                            Ce nom sera affiché dans les onglets du plan de salle.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-stone-400">
                            Succursale
                        </Label>
                        <Select onValueChange={(v) => setValue("branchId", v)} value={watch("branchId")}>
                            <SelectTrigger className="h-14 rounded-2xl bg-stone-50 border-none px-5 font-bold text-stone-800">
                                <SelectValue placeholder="Choisir une succursale" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)} className="font-bold">
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-200 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                "Confirmer la création"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
