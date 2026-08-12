"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2, Plus, Store} from "lucide-react";
import {toast} from "sonner";
import * as companyApi from "@/src/lib/api/company";
import {getErrorMessage} from "@/src/lib/errors";

interface AddBranchModalProps {
    companyId: number;
    companyName: string;
    onSuccess: () => void;
}

export function AddBranchModal({ companyId, companyName, onSuccess }: AddBranchModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get('name') ?? '');
        const address = String(formData.get('address') ?? '') || undefined;
        const phone = String(formData.get('phone') ?? '') || undefined;

        try {
            await companyApi.createBranch({ companyId, name, address, phone });
            toast.success(`Succursale "${name}" créée`);
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la création de la succursale"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest">
                    <Plus className="mr-1.5 h-4 w-4" /> Succursale
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Store size={20} />
                        </div>
                        Nouvelle <span className="text-indigo-600">Succursale</span>
                    </DialogTitle>
                    <p className="text-xs text-slate-400 font-medium ml-[52px]">Pour {companyName}</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Nom</Label>
                        <Input name="name" placeholder="Ex: Douala Centre" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Adresse</Label>
                        <Input name="address" placeholder="Ex: Akwa, Douala" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Téléphone</Label>
                        <Input name="phone" placeholder="+237 6XX XXX XXX" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-95">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Créer la succursale"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
