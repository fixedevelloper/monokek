"use client";

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());

  // Surveillance de la connexion réseau
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulation d'une synchronisation automatique toutes les 30s
    const interval = setInterval(() => {
      if (isOnline) {
        performSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const performSync = () => {
    setIsSyncing(true);
    // Ici, tu lancerais ta logique de synchro Zustand/Axios
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date().toLocaleTimeString());
    }, 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-3 px-4 py-1.5 rounded-full transition-all duration-500 border",
            isOnline 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : "bg-destructive/5 border-destructive/20 text-destructive animate-pulse"
          )}>
            {/* Icône de connexion */}
            <div className="relative">
              {isOnline ? <Wifi size={14} strokeWidth={3} /> : <WifiOff size={14} strokeWidth={3} />}
              {isOnline && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

            {/* Texte et Spinner */}
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {isOnline ? (isSyncing ? "Synchronisation..." : "Connecté") : "Hors-ligne"}
              </span>
              {isOnline && (
                <span className="text-[8px] font-bold opacity-60 uppercase italic">
                  Vérifié à {lastSync}
                </span>
              )}
            </div>

            {isOnline && (
              <button 
                onClick={performSync}
                disabled={isSyncing}
                className={cn("ml-1 transition-transform", isSyncing && "animate-spin")}
              >
                {isSyncing ? <RefreshCw size={12} /> : <CheckCircle2 size={12} className="opacity-40 hover:opacity-100" />}
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-950 text-white border-none text-[10px] font-bold uppercase p-2">
          {isOnline 
            ? "Toutes les données sont à jour sur le serveur." 
            : "Les ventes sont stockées localement. Reconnexion requise."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}