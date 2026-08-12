"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Building2, Loader2, Plus} from "lucide-react";
import {toast} from "sonner";
import * as companyApi from "@/src/lib/api/company";
import {getErrorMessage} from "@/src/lib/errors";

export function AddCompanyModal({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get('name') ?? '');
        const phone = String(formData.get('phone') ?? '') || undefined;
        const email = String(formData.get('email') ?? '') || undefined;

        try {
            await companyApi.createCompany({ name, phone, email });
            toast.success(`Société "${name}" créée`);
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la création de la société"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95">
                    <Plus className="mr-2 h-5 w-5" /> Nouvelle société
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Building2 size={20} />
                        </div>
                        Nouvelle <span className="text-indigo-600">Société</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Raison sociale</Label>
                        <Input name="name" placeholder="Ex: RestoPro Group" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Téléphone</Label>
                        <Input name="phone" placeholder="+237 6XX XXX XXX" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Email</Label>
                        <Input name="email" type="email" placeholder="contact@restopro.com" className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-95 disabled:opacity-70">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Créer la société"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
