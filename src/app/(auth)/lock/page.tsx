"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, User, Delete, LogOut, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/hooks/use-auth';
import { useUIStore } from '@/src/store/use-ui-store';
import api from '@/src/lib/axios';

export default function LockScreen() {
  const { user, logout } = useAuth();
  const { isLocked, setLocked } = useUIStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Simulation d'un code PIN (dans la vraie vie, vient du backend ou du user object)
  const CORRECT_PIN = "1234"; 

const [loading, setLoading] = useState(false);

const handleNumpad = async (val: string) => {
  setError(false);
  if (val === 'clear') return setPin("");
  
  if (pin.length < 4 && !loading) {
    const newPin = pin + val;
    setPin(newPin);
    
    if (newPin.length === 4) {
      setLoading(true);
      try {
        // Appel à ton endpoint Laravel
        await api.post('/api/auth/verify-pin', { pin: newPin });
        
        // Si succès (200 OK)
        setLocked(false);
        setPin("");
      } catch (err) {
        // Si erreur (401 ou autre)
        setError(true);
        setPin("");
        // Optionnel : petit délai avant de permettre de retaper
      } finally {
        setLoading(false);
      }
    }
  }
};

// Ajoute cet état dans ton composant

return (
  <AnimatePresence>
    {isLocked && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-sm px-6 space-y-8 flex flex-col items-center">
          
          {/* Header Profil */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-violet-600 p-1 shadow-2xl">
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {/* On affiche un loader si on vérifie le PIN */}
                 {loading ? (
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 ) : (
                   <span className="text-3xl font-black text-primary">{user?.name?.charAt(0)}</span>
                 )}
              </div>
              <div className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full border-4 border-background flex items-center justify-center">
                <Lock className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{user?.name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>

          {/* Indicateur de PIN avec animation d'erreur */}
          <div className={cn(
            "flex gap-4 justify-center py-4",
            error && "animate-shake" // On ajoute une petite secousse si erreur
          )}>
            {[1, 2, 3, 4].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-all duration-200",
                  pin.length > i ? "bg-primary border-primary scale-125" : "border-muted-foreground/30",
                  error && "bg-destructive border-destructive border-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                )}
              />
            ))}
          </div>

          {/* Pavé Numérique Rapide */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'del'].map((key) => (
              <Button
                key={key}
                variant="ghost"
                disabled={loading} // Désactivation pendant l'appel API
                className={cn(
                  "h-16 text-2xl font-bold rounded-2xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90",
                  key === 'C' || key === 'del' ? "text-muted-foreground" : ""
                )}
                onClick={() => {
                  if (key === 'C') setPin("");
                  else if (key === 'del') setPin(prev => prev.slice(0, -1));
                  else handleNumpad(key); // Cette fonction appelle maintenant l'API
                }}
              >
                {key === 'del' ? <Delete /> : key}
              </Button>
            ))}
          </div>

          {/* Actions de secours */}
          <div className="flex w-full gap-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 gap-2 font-bold uppercase text-[10px]" 
              onClick={logout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" /> Changer de session
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
}