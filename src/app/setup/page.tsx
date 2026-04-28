'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
// Note: Utilise tauri-plugin-store pour la persistance
import { Store } from "tauri-plugin-store-api";

export default function SetupPage() {
    const router = useRouter();
    const [ip, setIp] = useState('');
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // On charge l'IP existante au démarrage si elle existe
    useEffect(() => {
        const loadConfig = async () => {
            const store = new Store(".settings.dat");
            const savedIp = await store.get<string>("backend-ip");
            if (savedIp) setIp(savedIp);
        };
        loadConfig();
    }, []);

 const handleSave = async () => {
    setTesting(true);
    setStatus('idle');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        // 1. Appel au ping
        const response = await fetch(`http://${ip}/api/ping`, { 
            signal: controller.signal 
        });
      
        // .ok vérifie si le status est entre 200 et 299
        if (!response.ok) throw new Error("Serveur injoignable");

        const data = await response.json();

        // On vérifie que le contenu est bien celui de TON backend
        if (data.status === 'ok') {
             console.log(response)
            // 2. Stockage persistant dans Tauri
            const { Store } = await import("tauri-plugin-store-api"); // Import dynamique par sécurité
            const store = new Store(".settings.dat");
            
            await store.set("backend-ip", ip);
            await store.save(); 

            setStatus('success');
            toast.success("Terminal connecté avec succès");
            
            setTimeout(() => router.push('/'), 1500);
        } else {
            throw new Error("Réponse invalide");
        }
    } catch (error) {
        setStatus('error');
        toast.error("Connexion échouée : vérifiez l'IP et le réseau");
        console.error(error);
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
                                Entrez l'adresse IP du serveur central (Laravel)
                            </p>
                        </div>

                        <div className="w-full space-y-4 mt-4">
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                                <Input 
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    placeholder="192.168.1.50"
                                    className="h-14 pl-12 rounded-2xl bg-stone-50 border-none font-mono font-bold text-lg text-stone-800 placeholder:text-stone-200"
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
                                 status === 'success' ? <CheckCircle2 /> : "Connecter le terminal"}
                            </Button>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={14} /> Serveur introuvable
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <p className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
                Restaurant System v1.0 • Tauri Terminal
            </p>
        </div>
    );
}