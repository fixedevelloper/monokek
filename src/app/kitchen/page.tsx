"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Flame, Beer, Coffee, Utensils, Loader2, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/src/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEcho } from "@/src/hooks/useEcho";

interface KitchenStation {
    id: number;
    name: string;
    pending_tickets_count: number;
}

export default function KitchenDashboard() {
    const [stations, setStations] = useState<KitchenStation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const echo = useEcho();
    useEffect(() => {
        // 1. Définition de la fonction de récupération
        const fetchStations = async () => {
            try {
                // Pas besoin de mettre setLoading(true) à chaque fois, 
                // sinon l'écran va clignoter toutes les 45s.
                const { data } = await api.get("/api/kitchen/stations");
                setStations(data.data);
            } catch (error) {
                console.error("Erreur chargement stations");
            } finally {
                setLoading(false);
            }
        };

        // 2. Exécution immédiate au montage
        fetchStations();

        // 3. Mise en place du polling (45 000 ms)
const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
       // fetchStations();
    }
}, 45000);

        // 4. Nettoyage : très important pour éviter les fuites de mémoire
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (!echo) return;

        const channel = echo.channel('kitchen.stations')
            .listen('.station.updated', (station: any) => {
                console.log('station')
                console.log(station)
                setStations(prev => prev.map(s =>
                    s.id === station.id
                        ? { ...s, pending_tickets_count: station.pending_tickets_count }
                        : s
                ));
            });

        return () => echo.leaveChannel('kitchen.stations');
    }, [echo]);
    // Petit helper pour choisir une icône selon le nom de la station
    const getStationIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("grill")) return <Flame className="text-orange-500" size={32} />;
        if (n.includes("bar") || n.includes("boisson")) return <Beer className="text-blue-500" size={32} />;
        if (n.includes("café")) return <Coffee className="text-brown-500" size={32} />;
        return <Utensils className="text-primary" size={32} />;
    };
    const handleLogout = async () => {
        try {
            // Appel à ton API Laravel Sanctum pour révoquer le token
            await api.post('/api/logout');

            // Nettoyage local (LocalStorage, Cookies, etc.)
            localStorage.removeItem('token');

            toast.success("Déconnexion réussie");
            router.push('/login');
        } catch (error) {
            // Même en cas d'erreur API, on redirige souvent pour la sécurité
            router.push('/login');
        }
    };
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <LayoutGrid className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            Système KDS
                        </span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                        Stations de <span className="text-primary">Cuisine</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Sélectionnez une station pour voir les commandes en cours.
                    </p>
                </div>

                {/* BOUTON DECONNEXION */}
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="group h-14 px-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-transparent hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center gap-3 shadow-sm"
                >
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500">Session</span>
                        <span className="text-sm font-black uppercase italic leading-none text-slate-900 dark:text-white">Quitter</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <LogOut size={20} />
                    </div>
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stations.map((station) => (
                    <Link key={station.id} href={`/kitchen/tickets?station=${station.id}`}>
                        <Card className="group relative overflow-hidden p-8 rounded-[2.5rem] border-2 border-white dark:border-slate-900 hover:border-primary/50 transition-all shadow-sm hover:shadow-2xl bg-white dark:bg-slate-900 cursor-pointer">
                            {/* Effet de fond au hover */}
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                {getStationIcon(station.name)}
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {getStationIcon(station.name)}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">
                                        {station.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(
                                            "rounded-full px-4 font-black",
                                            station.pending_tickets_count > 0 ? "bg-red-500" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {station.pending_tickets_count} EN ATTENTE
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}