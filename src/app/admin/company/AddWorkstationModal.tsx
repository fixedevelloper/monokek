"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2, Monitor, Plus} from "lucide-react";
import {toast} from "sonner";
import * as companyApi from "@/src/lib/api/company";
import {getErrorMessage} from "@/src/lib/errors";

interface AddWorkstationModalProps {
    branchId: number;
    branchName: string;
    onSuccess: () => void;
}

export function AddWorkstationModal({ branchId, branchName, onSuccess }: AddWorkstationModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get('name') ?? '');
        const type = String(formData.get('type') ?? '') || 'pos';
        const ip = String(formData.get('ip') ?? '') || undefined;

        try {
            await companyApi.createWorkstation({ branchId, name, type, ip });
            toast.success(`Poste "${name}" créé`);
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la création du poste"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Poste
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Monitor size={20} />
                        </div>
                        Nouveau <span className="text-indigo-600">Poste</span>
                    </DialogTitle>
                    <p className="text-xs text-slate-400 font-medium ml-[52px]">Sur {branchName}</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Nom</Label>
                        <Input name="name" placeholder="Ex: Caisse 1" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Type</Label>
                        <Input name="type" placeholder="pos, kitchen, kds..." defaultValue="pos" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Adresse IP (optionnel)</Label>
                        <Input name="ip" placeholder="192.168.1.10" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold font-mono" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-95">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Créer le poste"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
