"use client";

import { useEffect, useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Pencil, LayoutGrid, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import { Table, Floor } from "@/src/types/tables";

interface EditTableModalProps {
    table: Table | null;
    floors: Floor[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditTableModal({ table, floors, open, onOpenChange, onSuccess }: EditTableModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<string>("");

    // Synchroniser l'étage quand la table change ou le modal s'ouvre
    useEffect(() => {
        if (table && floors.length > 0) {
            // On cherche l'id de l'étage qui contient cette table
            const currentFloor = floors.find(f => f.tables.some(t => t.id === table.id));
            if (currentFloor) setSelectedFloor(currentFloor.id.toString());
        }
    }, [table, floors, open]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            seats: formData.get('seats'),
            floor_id: selectedFloor,
            status: table?.status // On garde le statut actuel
        };

        try {
            await api.put(`/api/admin/tables/${table?.id}`, data);
            toast.success(`Table ${data.name} mise à jour`);
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                        <Pencil className="text-orange-500" size={20} /> Modifier <span className="text-orange-500">Table {table?.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Localisation */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-stone-500">Localisation (Floor)</Label>
                        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                            <SelectTrigger className="h-12 rounded-2xl bg-stone-50 border-none font-bold">
                                <SelectValue placeholder="Changer d'étage" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                {floors.map((floor) => (
                                    <SelectItem key={floor.id} value={floor.id.toString()} className="font-bold uppercase">
                                        {floor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nom */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-stone-500">Nom / N°</Label>
                            <Input
                                name="name"
                                defaultValue={table?.name}
                                className="h-12 rounded-2xl bg-stone-50 border-none px-4 font-black italic focus-visible:ring-orange-500/20"
                                required
                            />
                        </div>

                        {/* Places */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-stone-500">Places</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input
                                    name="seats"
                                    type="number"
                                    defaultValue={table?.seats}
                                    min="1"
                                    className="pl-10 h-12 rounded-2xl bg-stone-50 border-none font-bold focus-visible:ring-orange-500/20"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-stone-900 hover:bg-stone-800 text-white shadow-lg transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Sauvegarder les changements"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}