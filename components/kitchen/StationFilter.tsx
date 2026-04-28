"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ChefHat, Flame, Wine, Pizza, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Station {
  id: number;
  name: string;
  slug: string;
}

interface StationFilterProps {
  stations: Station[];
  activeStationId: number | null;
  onStationChange: (id: number | null) => void;
}

// Map d'icônes selon le slug de la station pour un look pro
const stationIcons: Record<string, any> = {
  'grill': Flame,
  'bar': Wine,
  'pizza': Pizza,
  'cuisine': ChefHat,
  'default': Utensils
};

export default function StationFilter({ stations, activeStationId, onStationChange }: StationFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card border-b shadow-sm sticky top-0 z-10">
      {/* Option "Toutes les stations" pour le Chef de cuisine */}
      <Button
        variant={activeStationId === null ? "default" : "outline"}
        onClick={() => onStationChange(null)}
        className={cn(
          "h-14 px-6 rounded-xl gap-2 font-bold transition-all",
          activeStationId === null ? "shadow-lg shadow-primary/20 scale-105" : ""
        )}
      >
        <Utensils className="h-5 w-5" />
        <span>TOUT</span>
      </Button>

      {stations.map((station) => {
        const Icon = stationIcons[station.slug] || stationIcons.default;
        const isActive = activeStationId === station.id;

        return (
          <Button
            key={station.id}
            variant={isActive ? "default" : "outline"}
            onClick={() => onStationChange(station.id)}
            className={cn(
              "h-14 px-6 rounded-xl gap-2 font-bold transition-all uppercase",
              isActive ? "shadow-lg shadow-primary/20 scale-105" : ""
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{station.name}</span>
          </Button>
        );
      })}
    </div>
  );
}