"use client";

import React from 'react';
import { AlertTriangle, ArrowRight, PackageOpen, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatStock } from '@/lib/utils';

interface LowStockIngredient {
  id: number;
  name: string;
  current_stock: number;
  threshold: number;
  unit: string;
}

interface StockAlertProps {
  items: LowStockIngredient[];
  onRestockClick?: (id: number) => void;
}

export default function StockAlert({ items, onRestockClick }: StockAlertProps) {
  // On ne montre rien s'il n'y a pas d'alerte
  if (items.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-destructive shadow-md bg-destructive/5">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle className="text-sm font-black uppercase tracking-wider">
            Alertes Stock ({items.length})
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1">
          <History className="h-3 w-3" /> VOIR TOUT
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-destructive/10">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 px-4 hover:bg-destructive/10 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-bold text-sm">{item.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-background text-[10px] h-5 border-destructive/30">
                    Seuil: {formatStock(item.threshold, item.unit)}
                  </Badge>
                  <span className={cn(
                    "text-xs font-black",
                    item.current_stock <= 0 ? "text-destructive animate-pulse" : "text-orange-600"
                  )}>
                    Reste: {formatStock(item.current_stock, item.unit)}
                  </span>
                </div>
              </div>

              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all"
                onClick={() => onRestockClick?.(item.id)}
              >
                <PlusIcon size={14} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlusIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}