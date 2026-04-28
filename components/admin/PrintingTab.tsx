"use client";

import React, { useEffect, useState } from 'react';
import { Printer, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/src/lib/axios";
import { toast } from "sonner";
import { TabsContent } from '../ui/tabs';

export default function PrintingTab({ settings, updateSetting }: any) {
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Charger les imprimantes enregistrées en base de données
  useEffect(() => {
    api.get('/printers').then(({ data }) => {
      setAvailablePrinters(data.data || []);
    });
  }, []);

  const handleTestPrint = async () => {
    if (!settings.default_printer_id) {
      toast.error("Sélectionnez d'abord une imprimante");
      return;
    }
    
    setIsTesting(true);
    try {
      await api.post(`/printers/${settings.default_printer_id}/test`);
      toast.success("Impression de test envoyée !");
    } catch (e) {
      toast.error("Erreur de connexion à l'imprimante");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <TabsContent value="printing" className="space-y-6">
      <Card className="border-none shadow-sm bg-white rounded-[2rem]">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Printer size={24} />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase italic">Imprimante Thermique</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Configurez votre sortie ticket (ESC/POS).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Imprimante par défaut</Label>
              <Select 
                value={settings.default_printer_id?.toString()} 
                onValueChange={(val) => updateSetting('default_printer_id', val)}
              >
                <SelectTrigger className="bg-muted/30 border-none h-12 rounded-xl">
                  <SelectValue placeholder="Choisir une imprimante..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} ({p.connection.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleTestPrint}
                disabled={isTesting}
                className="w-full h-12 border-2 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
              >
                {isTesting ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw size={14} />}
                Tester l'impression
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Préférences du Ticket</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase">Logo sur ticket</span>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Afficher l'image d'en-tête</p>
                </div>
                <Switch 
                  checked={settings.print_logo === "true" || settings.print_logo === true}
                  onCheckedChange={(val) => updateSetting('print_logo', val)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase">Tiroir caisse</span>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Ouverture auto après paiement</p>
                </div>
                <Switch 
                  checked={settings.open_drawer === "true" || settings.open_drawer === true}
                  onCheckedChange={(val) => updateSetting('open_drawer', val)}
                />
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}