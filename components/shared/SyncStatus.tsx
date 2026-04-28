"use client";

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true); // État du navigateur
  const [isSyncing, setIsSyncing] = useState(false); // État de l'envoi des données
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    // Écouteurs pour le statut de la connexion réseau
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulation d'une synchro périodique (Background Sync)
    const syncInterval = setInterval(() => {
      if (isOnline) {
        setIsSyncing(true);
        // Simulation d'appel API vers Laravel
        setTimeout(() => {
          setIsSyncing(false);
          setLastSync(new Date());
        }, 2000);
      }
    }, 60000); // Toutes les minutes

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary/50 border shadow-sm transition-all">
      {/* Icône de Statut */}
      <div className="relative">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-emerald-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive animate-bounce" />
        )}
        {/* Point indicateur pulsant */}
        <span className={cn(
          "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background",
          isOnline ? "bg-emerald-500" : "bg-destructive"
        )} />
      </div>

      {/* Texte et Infos */}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isOnline ? "Connecté" : "Hors-ligne"}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <AnimatePresence mode="wait">
            {isSyncing ? (
              <motion.div
                key="syncing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-2.5 w-2.5 animate-spin text-primary" />
                <span className="text-[9px] text-muted-foreground italic">Synchro...</span>
              </motion.div>
            ) : (
              <motion.div
                key="synced"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[9px] text-muted-foreground">
                  {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}