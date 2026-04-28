"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Utensils, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KitchenItem {
  id: number;
  name: string;
  qty: number;
  note?: string;
  modifiers: string[];
}

interface TicketCardProps {
  orderId: number;
  reference: string;
  table?: string;
  items: KitchenItem[];
  createdAt: string;
  status: 'pending' | 'preparing' | 'ready';
  onStatusChange: (id: number, nextStatus: string) => void;
}

export default function TicketCard({ 
  orderId, reference, table, items, createdAt, status, onStatusChange 
}: TicketCardProps) {
  const [minutesElapsed, setMinutesElapsed] = useState(0);

  // Calcul du temps écoulé en temps réel
  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      setMinutesElapsed(Math.floor((now - start) / 60000));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); // Update toutes les 30s
    return () => clearInterval(interval);
  }, [createdAt]);

  // Alerte visuelle si le ticket traîne (ex: > 15 min)
  const isUrgent = minutesElapsed >= 15 && status !== 'ready';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[350px]"
    >
      <Card className={cn(
        "border-t-8 shadow-lg transition-all",
        status === 'ready' ? "border-t-green-500 opacity-70" : 
        isUrgent ? "border-t-red-500 animate-pulse" : "border-t-primary"
      )}>
        <CardHeader className="p-4 space-y-0 flex flex-row items-center justify-between bg-muted/30">
          <div>
            <h3 className="font-black text-lg">{table || "EMPORTER"}</h3>
            <p className="text-xs font-mono text-muted-foreground">#{reference}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
            isUrgent ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
          )}>
            <Clock className="h-3 w-3" />
            {minutesElapsed}m
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-black">
                {item.qty}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm uppercase leading-tight">{item.name}</p>
                {item.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.modifiers.map((m, i) => (
                      <span key={i} className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1 rounded uppercase">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                {item.note && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {status !== 'ready' ? (
            <Button 
              className="w-full h-12 gap-2 text-md font-black shadow-md"
              onClick={() => onStatusChange(orderId, 'ready')}
            >
              <CheckCircle2 className="h-5 w-5" /> PRÊT
            </Button>
          ) : (
            <div className="w-full text-center py-2 text-green-600 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> TERMINÉ
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}