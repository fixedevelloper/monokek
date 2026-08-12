"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FolderPlus, Loader2, Plus} from "lucide-react";
import {toast} from "sonner";
import * as catalogApi from "@/src/lib/api/catalog";
import {Branch} from "@/src/types/company";
import {getErrorMessage} from "@/src/lib/errors";

interface AddCategoryModalProps {
    onCategoryAdded: () => void;
    branches: Branch[];
}

interface CategoryFormValues {
    name: string;
    branchId: string;
}

export function AddCategoryModal({ onCategoryAdded, branches }: AddCategoryModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue, reset } = useForm<CategoryFormValues>({
        defaultValues: { name: "", branchId: "" },
    });

    useEffect(() => {
        if (open) {
            reset({ name: "", branchId: branches[0] ? String(branches[0].id) : "" });
        }
    }, [open, branches, reset]);

    const onSubmit = async (data: CategoryFormValues) => {
        if (!data.branchId) {
            toast.error("Choisissez une succursale.");
            return;
        }
        setLoading(true);
        try {
            await catalogApi.createCategory({ branchId: Number(data.branchId), name: data.name });

            toast.success(`Catégorie "${data.name}" créée !`);
            setOpen(false);
            onCategoryAdded();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la création"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="h-10 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2">
                    <FolderPlus size={16} /> Nouvelle catégorie
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        Nouvelle <span className="text-primary">Catégorie</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom</Label>
                        <Input
                            {...register("name", { required: true })}
                            placeholder="Ex: Boissons, Desserts..."
                            className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Succursale</Label>
                        <Select onValueChange={(v) => setValue("branchId", v)} value={watch("branchId")}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
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

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    <Plus size={18} /> Créer la catégorie
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
