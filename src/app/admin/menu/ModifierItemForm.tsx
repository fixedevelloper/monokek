import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

export function ModifierItemForm({ groupId, onActionComplete }: any) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!name) return toast.error("Le nom est requis");

        setLoading(true);
        try {
            await api.post(`/api/admin/modifiers/${groupId}/items`, {
                name,
                price: parseFloat(price) || 0,
            });
            setName("");
            setPrice("");
            onActionComplete(); // Rafraîchir la liste
            toast.success("Option ajoutée");
        } catch (error) {
            toast.error("Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-slate-900 rounded-[1.5rem] space-y-3 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nouvelle Option</p>
            <div className="grid grid-cols-1  gap-2">
                <input
                    placeholder="Nom (ex: Supplément)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-slate-800 border-none rounded-xl px-3 py-2 text-xs text-white font-bold focus:ring-1 ring-primary"
                />
                <input
                    type="number"
                    placeholder="Prix"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-slate-800 border-none rounded-xl px-3 py-2 text-xs text-white font-bold focus:ring-1 ring-primary"
                />
                <Button size="icon" className="h-9 w-24 shrink-0 bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                </Button>
            </div>
        </div>
    );
}