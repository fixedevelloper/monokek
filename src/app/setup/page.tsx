'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SetupPage() {
    const router = useRouter();
    const [ip, setIp] = useState('');
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // 1. Chargement initial avec la syntaxe V2
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const { load } = await import("@tauri-apps/plugin-store");
               const store = await load(".settings.json", {
  autoSave: true,
  defaults: {}
});
                const savedIp = await store.get<string>("backend-ip");
                if (savedIp) setIp(savedIp);
            } catch (e) {
                console.error("Erreur chargement config:", e);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setTesting(true);
        setStatus('idle');

        // Nettoyage de l'IP saisie par l'utilisateur (Cameroun style : on évite les erreurs de frappe)
        let cleanIp = ip.trim().replace(/\/+$/, "");
        if (!cleanIp.startsWith('http')) {
            cleanIp = `http://${cleanIp}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s

        try {
            // 2. Test de connexion (Ping sur ton backend Laravel)
            const response = await fetch(`${cleanIp}/api/ping`, { 
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
          
            if (!response.ok) throw new Error("Serveur injoignable");

            const data = await response.json();

            if (data.status === 'ok') {
                // 3. Stockage persistant avec la syntaxe V2
                const { load } = await import("@tauri-apps/plugin-store");
               const store = await load(".settings.json", {
  autoSave: true,
  defaults: {}
});
                
                // On stocke l'IP propre
                await store.set("backend-ip", cleanIp.replace('http://', ''));
                // Avec autoSave: true, le store.save() est géré automatiquement, 
                // mais on peut le forcer pour être sûr avant la redirection
                await store.save(); 

                setStatus('success');
                toast.success("Terminal connecté au serveur");
                
                // Petite pause pour laisser l'utilisateur voir le succès
                setTimeout(() => router.push('/'), 1200);
            } else {
                throw new Error("Réponse invalide du serveur");
            }
        } catch (error) {
            setStatus('error');
            toast.error("Connexion échouée : vérifiez l'IP et le réseau");
            console.error("Erreur Setup:", error);
        } finally {
            clearTimeout(timeoutId);
            setTesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                <CardContent className="p-10">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-stone-900 flex items-center justify-center text-white shadow-lg shadow-stone-200">
                            <Settings className={testing ? "animate-spin" : ""} />
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif font-bold text-stone-900 italic">Configuration</h1>
                            <p className="text-sm text-stone-500 font-medium tracking-wide">
                                Adresse IP du serveur central
                            </p>
                        </div>

                        <div className="w-full space-y-4 mt-4">
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                                <Input 
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    placeholder="ex: 192.168.1.50"
                                    className="h-14 pl-12 rounded-2xl bg-stone-50 border-none font-mono font-bold text-lg text-stone-800 placeholder:text-stone-200 focus-visible:ring-stone-900"
                                />
                            </div>

                            <Button 
                                onClick={handleSave}
                                disabled={testing || !ip}
                                className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                                    status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-stone-900 hover:bg-stone-800'
                                }`}
                            >
                                {testing ? <Loader2 className="animate-spin" /> : 
                                 status === 'success' ? <CheckCircle2 /> : "Vérifier & Enregistrer"}
                            </Button>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center animate-in fade-in zoom-in-95">
                                    <AlertCircle size={14} /> Impossible de joindre le backend
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <p className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
                MONO-KEK POS • v2.0 • TAURI NATIVE
            </p>
        </div>
    );
}