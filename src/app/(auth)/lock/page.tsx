"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, User, Delete, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/hooks/use-auth';
import { useUIStore } from '@/src/store/use-ui-store';

export default function LockScreen() {
  const { user, logout } = useAuth();
  const { isLocked, setLocked } = useUIStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Simulation d'un code PIN (dans la vraie vie, vient du backend ou du user object)
  const CORRECT_PIN = "1234"; 

  const handleNumpad = (val: string) => {
    setError(false);
    if (val === 'clear') return setPin("");
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      
      // Vérification automatique à 4 chiffres
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          setLocked(false);
          setPin("");
        } else {
          setError(true);
          setPin("");
          // Petit feedback haptique/visuel ici
        }
      }
    }
  };

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
                   <span className="text-3xl font-black text-primary">{user?.name?.charAt(0)}</span>
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

            {/* Indicateur de PIN */}
            <div className="flex gap-4 justify-center py-4">
              {[1, 2, 3, 4].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition-all duration-200",
                    pin.length > i ? "bg-primary border-primary scale-125" : "border-muted-foreground/30",
                    error && "bg-destructive border-destructive animate-bounce"
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
                  className={cn(
                    "h-16 text-2xl font-bold rounded-2xl hover:bg-primary/10 hover:text-primary transition-all",
                    key === 'C' || key === 'del' ? "text-muted-foreground" : ""
                  )}
                  onClick={() => {
                    if (key === 'C') handleNumpad('clear');
                    else if (key === 'del') handleNumpad('clear'); // ou slice
                    else handleNumpad(key);
                  }}
                >
                  {key === 'del' ? <Delete /> : key}
                </Button>
              ))}
            </div>

            {/* Actions de secours */}
            <div className="flex w-full gap-4 pt-4">
              <Button variant="outline" className="flex-1 h-12 gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" /> Changer de session
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}