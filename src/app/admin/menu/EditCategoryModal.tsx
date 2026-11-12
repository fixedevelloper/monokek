"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Edit3, Loader2} from "lucide-react";
import {toast} from "sonner";
import * as catalogApi from "@/src/lib/api/catalog";
import {Category} from "@/src/types/menus";
import {getErrorMessage} from "@/src/lib/errors";
import {KitchenStation, stationLabel} from "@/src/types/kitchenStation";

interface EditCategoryModalProps {
    category: Category;
    kitchenStations: KitchenStation[];
    /** Succursale de la catégorie : sert à signaler les stations d'une cuisine centrale. */
    branchId: number;
    onCategoryUpdated: () => void;
}

interface CategoryFormValues {
    name: string;
    kitchenStationId: string;
}

const NO_STATION = "none";

export function EditCategoryModal({ category, kitchenStations, branchId, onCategoryUpdated }: EditCategoryModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue } = useForm<CategoryFormValues>({
        defaultValues: {
            name: category.name,
            kitchenStationId: category.kitchen_station_id ? String(category.kitchen_station_id) : NO_STATION,
        },
    });

    const onSubmit = async (data: CategoryFormValues) => {
        if (!category.id) return;
        setLoading(true);
        try {
            await catalogApi.updateCategory(category.id, {
                name: data.name,
                // Voir AddCategoryModal : sans station cuisine, les produits de cette catégorie
                // ne génèrent jamais de ticket en cuisine/comptoir.
                kitchenStationId: data.kitchenStationId === NO_STATION ? undefined : Number(data.kitchenStationId),
                // Propriétaire : c'est la station de la succursale de l'onglet, pas forcément celle d'origine de la catégorie.
                branchId,
            });

            toast.success(`Catégorie "${data.name}" mise à jour !`);
            setOpen(false);
            onCategoryUpdated();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la modification"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full hover:bg-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Edit3 size={12} />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        Modifier la <span className="text-primary">Catégorie</span>
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
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Station cuisine</Label>
                        <Select onValueChange={(v) => setValue("kitchenStationId", v)} value={watch("kitchenStationId")}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
                                <SelectValue placeholder="Aucune (pas de ticket cuisine)" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                <SelectItem value={NO_STATION} className="font-bold text-slate-400">
                                    Aucune
                                </SelectItem>
                                {kitchenStations.map((station) => (
                                    <SelectItem key={station.id} value={String(station.id)} className="font-bold">
                                        {stationLabel(station, branchId)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-400 ml-1">
                            Sans station, les produits de cette catégorie n&apos;apparaîtront jamais en cuisine ou au comptoir.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Enregistrer les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
