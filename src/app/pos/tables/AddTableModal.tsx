"use client";

import { useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Plus, LayoutGrid, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/lib/axios";

interface Floor {
    id: number;
    name: string;
}

interface AddTableModalProps {
    floors: Floor[];
    activeFloorId: string | number;
    onSuccess: () => void;
}

export function AddTableModal({ floors, activeFloorId, onSuccess }: AddTableModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(activeFloorId.toString());

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            seats: formData.get('seats'),
            floor_id: selectedFloor,
            status: 'free' // Statut par défaut selon ton schéma
        };

        try {
            await api.post('/api/admin/tables', data);
            toast.success(`Table ${data.name} ajoutée avec succès`);
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20">
                    <Plus size={16} /> Ajouter une table
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                        <LayoutGrid className="text-primary" /> Nouvelle <span className="text-primary">Table</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Choix de l'étage / Zone */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Localisation (Floor)</Label>
                        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue placeholder="Sélectionner l'étage" />
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
                        {/* Nom de la table */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom / N°</Label>
                            <Input name="name" placeholder="Ex: T-05" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-black italic" required />
                        </div>
                        
                        {/* Nombre de places (seats) */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nombre de places</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input name="seats" type="number" defaultValue="4" min="1" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Confirmer la création"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}