"use client";

import { useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layers, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/lib/axios";

interface AddFloorModalProps {
    onSuccess: () => void;
}

export function AddFloorModal({ onSuccess }: AddFloorModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
        };

        try {
            // Appel vers ton backend Laravel
            await api.post('/api/pos/floors', data);
            
            toast.success(`Zone "${data.name}" créée avec succès`);
            setOpen(false);
            onSuccess(); // Rafraîchir la liste des étages
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la création de l'étage");
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

                <form onSubmit={handleSubmit} className="space-y-8 mt-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-stone-400">
                            Nom de l'espace
                        </Label>
                        <Input 
                            name="name" 
                            placeholder="Ex: Terrasse Vue Mer, Salon Privé..." 
                            className="h-14 rounded-2xl bg-stone-50 border-none px-5 font-bold text-stone-800 placeholder:text-stone-300 focus-visible:ring-2 focus-visible:ring-orange-500/20" 
                            required 
                            autoFocus
                        />
                        <p className="text-[10px] text-stone-400 italic ml-1">
                            Ce nom sera affiché dans les onglets du plan de salle.
                        </p>
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