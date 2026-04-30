'use client'

import { useState, useEffect } from 'react';
import { load } from "@tauri-apps/plugin-store";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [ip, setIp] = useState("");
  const router = useRouter();
    // Charger l'IP actuelle au montage
    useEffect(() => {
        const loadIp = async () => {
            const store = await load(".settings.json");
            const savedIp = await store.get<string>("backend-ip");
            if (savedIp) setIp(savedIp);
        };
        loadIp();
    }, []);

    const updateIp = async () => {
        try {
                      const store = await load(".settings.json", {
                    autoSave: true,
                    defaults: {}
                });
            await store.set("backend-ip", ip);
            await store.save(); // Force l'écriture sur le disque

            toast.success("Configuration mise à jour !");
            
            // Recharger l'application pour que Axios et Echo prennent la nouvelle IP
            setTimeout(() => {
                window.location.reload(); 
            }, 1000);

            
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde");
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Configuration Serveur</h2>
            <div className="space-y-2">
                <label className="text-sm font-medium">Adresse IP du Serveur</label>
                <input 
                    type="text" 
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="Ex: 192.168.1.50"
                    className="w-full p-4 bg-stone-100 rounded-2xl border-none focus:ring-2 focus:ring-stone-900"
                />
            </div>
            <button 
                onClick={updateIp}
                className="w-full h-14 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
                <Save size={20} /> Sauvegarder et Redémarrer
            </button>
        </div>
    );
}