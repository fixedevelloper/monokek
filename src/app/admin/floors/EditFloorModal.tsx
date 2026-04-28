"use client";

import { useEffect, useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import { Floor } from "@/src/types/tables";

interface EditFloorModalProps {
    floor: Floor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditFloorModal({ floor, open, onOpenChange, onSuccess }: EditFloorModalProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!floor) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
        };

        try {
            await api.put(`/api/pos/floors/${floor.id}`, data);
            toast.success("Zone renommée avec succès");
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
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-stone-900">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Layers size={20} />
                        </div>
                        Modifier <span className="text-orange-600">la Zone</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 mt-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-stone-400">
                            Nouveau nom
                        </Label>
                        <Input 
                            name="name" 
                            defaultValue={floor?.name}
                            placeholder="Nom de la zone" 
                            className="h-14 rounded-2xl bg-stone-50 border-none px-5 font-bold text-stone-800 focus-visible:ring-2 focus-visible:ring-orange-500/20" 
                            required 
                        />
                    </div>

                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-stone-900 hover:bg-stone-800 text-white shadow-lg transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <span className="flex items-center gap-2">
                                    <Save size={18} /> Enregistrer
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}