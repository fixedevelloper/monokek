'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ArrowRight, Loader2 } from 'lucide-react';
import api from "@/src/lib/axios";
import { toast } from "sonner";

export default function RegistersPage() {
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api.get('api/cash/registers')
            .then(res => setRegisters(res.data))
            .catch(() => toast.error("Erreur de chargement des caisses"))
            .finally(() => setLoading(false));
    }, []);

    const selectRegister = async (reg: any) => {
        const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
        
        if (isTauri) {
            const { load } = await import("@tauri-apps/plugin-store");
            const store = await load(".settings.json", {
  autoSave: true,
  defaults: {}
});
            await store.set("register-id", reg.id);
            await store.set("register-name", reg.name);
            await store.save();
        } else {
            localStorage.setItem("register-id", reg.id.toString());
        }

        toast.success(`Terminal assigné à : ${reg.name}`);
        router.push('/pos/sales/order'); // Retour au dashboard qui ouvrira le modal
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-stone-50 p-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-serif font-bold italic text-stone-900">Assigner ce terminal</h1>
                    <p className="text-stone-500 text-lg">Sélectionnez la caisse physique correspondant à ce poste</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {registers.map((reg: any) => (
                        <button
                            key={reg.id}
                            onClick={() => selectRegister(reg)}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all border-none text-left flex items-center justify-between"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center transition-colors">
                                    <Monitor size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-stone-900">{reg.name}</h3>
                                    <p className="text-stone-400 text-sm">ID: {reg.id} • Branch: {reg.branch_id}</p>
                                </div>
                            </div>
                            <ArrowRight className="text-stone-200 group-hover:text-stone-900 group-hover:translate-x-2 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}