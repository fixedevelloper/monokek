"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Store, Printer, CreditCard, 
  ShieldCheck, RefreshCw, Database, Loader2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import api from "@/src/lib/axios";
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';
export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [systemPrinters, setSystemPrinters] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Charger les réglages depuis Laravel
      const { data } = await api.get('api/admin/settings');
      setSettings(data);
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('api/admin/settings', { settings });
      toast.success("Configurations enregistrées");
    } catch (error) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

const handleTestPrint = async () => {
  if (!settings.default_printer_name) return toast.error("Sélectionnez une imprimante");

  try {
    await invoke("print_receipt", {
  printerName: "XP-80",
  lines: [
    "MONO-KEP POS",
    "----------------------",
    "2 x Coca Cola   2 000",
    "1 x Riz         1 500",
    "----------------------",
    "TOTAL           3 500",
    "Merci !"
  ]
});
    // Dans la v2, on utilise souvent print_html pour envoyer du contenu stylisé
/*     await printHtml({
      id: settings.default_printer_name,
      html: `
        <div style="text-align: center; font-family: sans-serif;">
          <h1 style="font-size: 20px; margin: 0;">MONO-KEK POS</h1>
          <p style="font-size: 12px; font-weight: bold;">TEST IMPRESSION V2</p>
          <hr />
          <p style="font-size: 10px;">Connexion Rust-Bridge établie avec succès.</p>
        </div>
      `,
      printer: 'Microsoft Print to PDF'
    });
     */
    toast.success("Impression lancée via le plugin v2 !");
  } catch (e) {
    console.error(e);
    toast.error("Erreur : " + e);
  }
};

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="font-black italic uppercase text-slate-400 animate-pulse tracking-tighter">Initialisation de l'environnement Tauri...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-slate-100" asChild>
            <Link href="/admin"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Réglages</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
              Configuration {settings.store_name || 'Mono-Kek'}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
          {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl h-12 inline-flex overflow-x-auto max-w-full">
          <TabsTrigger value="general" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
            <Store size={14} /> Succursale
          </TabsTrigger>
          <TabsTrigger value="printing" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
            <Printer size={14} /> Impression
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
            <CreditCard size={14} /> Taxes
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
            <ShieldCheck size={14} /> Sécurité
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET GÉNÉRAL --- */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic">Identité du point de vente</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-tight">Apparaît sur les tickets physiques.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Nom de l'établissement</Label>
                  <Input 
                    value={settings.store_name || ""} 
                    onChange={(e) => updateSetting('store_name', e.target.value)}
                    className="bg-muted/30 border-none h-12 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Adresse</Label>
                  <Input 
                    value={settings.store_address || ""} 
                    onChange={(e) => updateSetting('store_address', e.target.value)}
                    className="bg-muted/30 border-none h-12" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic">Paramètres de Vente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Devise Principale</Label>
                  <Select value={settings.currency || "XAF"} onValueChange={(v) => updateSetting('currency', v)}>
                    <SelectTrigger className="bg-muted/30 border-none h-12 font-bold">
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAF">Franc CFA (XAF)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Mode Hors-ligne</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Ventes sans connexion internet</p>
                  </div>
                  <Switch 
                    checked={settings.offline_mode === true || settings.offline_mode === "true"}
                    onCheckedChange={(v) => updateSetting('offline_mode', v)} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- ONGLET IMPRESSION (DYNAMIQUE TAURI) --- */}
        <TabsContent value="printing" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem]">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Printer size={24} />
                </div>
                <div>
                  <CardTitle className="text-sm font-black uppercase italic">Hardware Impression (Rust Bridge)</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase">Communication directe via le driver natif de l'OS.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Détecter les périphériques</Label>
                    <Select 
                      value={settings.default_printer_name} 
                      onValueChange={(v) => updateSetting('default_printer_name', v)}
                    >
                      <SelectTrigger className="bg-muted/30 border-none h-12 font-bold rounded-xl">
                        <SelectValue placeholder="Sélectionner l'imprimante..." />
                      </SelectTrigger>
                      <SelectContent>
                     {/*    {systemPrinters.map((p: any) => (
                          <SelectItem key={p.name} value={p.name} className="font-bold">
                            {p.name} {p.is_default && "⭐"}
                          </SelectItem>
                        ))} */}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={handleTestPrint}
                      disabled={isTesting}
                      className="w-full h-12 border-2 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl active:scale-95 transition-all"
                    >
                       {isTesting ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw size={14} />}
                       Lancer un ticket de test
                    </Button>
                 </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Commandes ESC/POS</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white">
                    <span className="text-[11px] font-black uppercase">Imprimer logo (Binaire)</span>
                    <Switch 
                      checked={settings.print_logo === true || settings.print_logo === "true"}
                      onCheckedChange={(v) => updateSetting('print_logo', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white">
                    <span className="text-[11px] font-black uppercase">Ouverture tiroir auto</span>
                    <Switch 
                      checked={settings.open_drawer === true || settings.open_drawer === "true"}
                      onCheckedChange={(v) => updateSetting('open_drawer', v)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET SÉCURITÉ --- */}
        <TabsContent value="security" className="space-y-6">
           <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic">Base de données & Backup</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                <div className="flex items-center gap-4">
                   <Database className="text-primary h-8 w-8" />
                   <div>
                      <p className="font-black text-sm uppercase tracking-tight italic text-primary">Synchronisation Tauri SQL</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">État: Connecté au Cloud & Local SQLite</p>
                   </div>
                </div>
                <Button variant="outline" className="font-black text-[10px] uppercase border-primary text-primary rounded-xl px-6 h-10 hover:bg-primary hover:text-white transition-all">
                  Backup manuel
                </Button>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}