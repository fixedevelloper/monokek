"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, Database, Loader2, PrinterX,
  RefreshCw, Save, ShieldCheck, Store
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings2, Play, Globe, Usb, Trash2 } from "lucide-react";
import api from "@/src/lib/axios";
import { toast } from "sonner";

// Importations spécifiques à Tauri v2
import { list_thermal_printers, ENCODE, print_thermal_printer, type PrintJobRequest } from "tauri-plugin-thermal-printer";
import {getLocalSettings, initStore, saveLocalSettings} from "../../../lib/storage";
import {PrinterDialog} from "./PrinterDialogAdd";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {usePrint} from "../../../hooks/use-print";
import {Printer, PrinterFormValues} from "../../../types/menus";
export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printerToEdit, setPrinterToEdit] = useState<Printer | null>(null);
  const queryClient = useQueryClient();
  const { processPrintJob } = usePrint();
  // --- LECTURE : fetchPrinters ---
  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: async () => {
      const response = await api.get('/api/admin/settings/printers');
      // On s'assure de retourner le tableau (vérifie si ton api retourne response ou response.data)
      return response.data || response;
    }
  });
  interface DeviceFormValues {
    name: string;
    ip: string;
    type: string;
    connection: string;
    port: string;
    branch_id: string;
    location: string; // AJOUTE CECI
  }
  // --- CRÉATION : handleAddPrinter ---
// Spécifie les types entre < > : <TypeDonnéesRetour, TypeErreur, TypeVariablesEntrée>
  const addPrinterMutation = useMutation<any, any, PrinterFormValues>({
    mutationFn: async (formData: PrinterFormValues) => {
      return await api.post('/api/admin/settings/printers', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      toast.success("Imprimante ajoutée !");
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || "Erreur de validation";
      toast.error(message);
      console.error(err);
    }
  });

  // --- TEST : Tester une imprimante (Optionnel mais recommandé) ---


  const testPrinterMutation = useMutation({
    mutationFn: async (printer) => {
      // On crée un "Faux" Job qui sera traité par ton hook usePrint
      const testJob = {
        id: "TEST_" + Date.now(),
        job_type: "receipt", // On utilise le format reçu pour le test
        printer: printer,    // L'objet printer complet (incluant IP ou USB name)
        content: {
          order: {
            reference: "TEST-PRINT",
            total: "0",
            items: [
              {
                qty: 1,
                product: { name: "TEST IMPRESSION OK" },
                price: 0,
                total: 0
              }
            ],
            table: { name: "TEST" },
            cashier: { name: "ADMIN" }
          }
        }
      };

      // On appelle la logique centrale du hook
      return await processPrintJob(testJob);
    },
    onSuccess: () => {
      toast.success("Signal de test envoyé à l'imprimante !");
    },
    onError: (err) => {
      toast.error("Échec du test : Vérifiez la connexion");
      console.error(err);
    }
  });


  // --- MISE À JOUR : handleEditPrinter ---
  const updatePrinterMutation = useMutation({
    mutationFn: async (formData:any) => {
      // Laravel attend souvent un PUT ou PATCH pour l'update
      return await api.put(`/api/admin/settings/printers/${formData.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      toast.success("Imprimante mise à jour !");
      setPrinterToEdit(null); // Ferme le modal en réinitialisant l'état
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de la modification");
    }
  });
  useEffect(() => {
    const init = async () => {
      await initStore();
      const local = await getLocalSettings();
      if (local) {
        setSettings(local);
      }
      await fetchInitialData();
    };
    init();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data } = await api.get('api/admin/settings');
      setSettings(data);
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      toast.error("Erreur lors du chargement des paramètres");
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
      await saveLocalSettings(settings);
      toast.success("Configurations enregistrées avec succès");
    } catch (error) {
      await saveLocalSettings(settings);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };


  if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="font-black italic uppercase text-slate-400 animate-pulse tracking-tighter">
          Synchronisation avec le bridge Rust...
        </p>
      </div>
  );

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">

        {/* HEADER FIXE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-slate-100" asChild>
              <Link href="/admin"><ArrowLeft size={20} /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Réglages</h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
                Configuration Système • {settings.store_name || 'Mono-Kek'}
              </p>
            </div>
          </div>
          <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl shadow-primary/20"
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
            {saving ? "En cours..." : "Sauvegarder les modifications"}
          </Button>
        </div>

        <Tabs defaultValue="printing" className="space-y-6">
          <TabsList className="bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl h-12">
            <TabsTrigger value="general" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <Store size={14} /> Succursale
            </TabsTrigger>
            <TabsTrigger value="printing" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <PrinterX size={14} /> Impression
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <ShieldCheck size={14} /> Système
            </TabsTrigger>
          </TabsList>

          {/* --- ONGLET IMPRESSION --- */}
          <TabsContent value="printing" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <PrinterX size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase italic">Gestionnaire d'impression</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase">Configuration des imprimantes thermiques ESC/POS</CardDescription>
                    </div>
                  </div>

                  {/* Bouton Ajouter */}
                  <Button size="sm" className="rounded-xl gap-2 font-bold uppercase text-[10px]" onClick={() => {/* Ouvrir Modal */}}>
                    <Plus size={16} />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {printers.map((printer:any) => (
                      <Card key={printer.id} className="group border border-slate-100 shadow-none rounded-3xl hover:border-primary/50 transition-all duration-300">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${printer.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                              {printer.type === 'network' ? <Globe size={20} /> : <Usb size={20} />}
                            </div>
                            <Badge variant={printer.status === 'online' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                              {printer.status}
                            </Badge>
                          </div>

                          <div className="space-y-1 mb-6">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{printer.name}</h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {printer.type === 'network' ? printer.ip : 'Connecté en USB'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={testPrinterMutation.isPending}
                                onClick={() => testPrinterMutation.mutate(printer)} // 'printer' vient de ton .map()
                                className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100 hover:bg-primary hover:text-white"
                            >
                              {testPrinterMutation.isPending ? (
                                  <span className="animate-spin">...</span>
                              ) : (
                                  <>
                                    <Play size={12} />
                                    Tester
                                  </>
                              )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100"
                                onClick={() => setPrinterToEdit(printer)}
                            >
                              <Settings2 size={12} />
                              Éditer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  ))}

                  {/* Empty State / Quick Add Zone */}
                  <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="group border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 transition-all gap-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Nouvelle Imprimante</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- AUTRES ONGLETS (Simplifiés pour l'exemple) --- */}
          <TabsContent value="general">
            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Nom de la boutique</Label>
                    <Input
                        value={settings.store_name || ""}
                        onChange={(e) => updateSetting('store_name', e.target.value)}
                        className="h-12 bg-slate-100 border-none rounded-xl font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        <PrinterDialog
            open={!!printerToEdit || isAddModalOpen}
            onOpenChange={(open) => {
              if(!open) {
                setPrinterToEdit(null);
                setIsAddModalOpen(false);
              }
            }}
            initialData={printerToEdit}
            onSubmit={(data: PrinterFormValues) => {
              // On crée une référence stable pour TypeScript
              const currentPrinter = printerToEdit;

              if (currentPrinter) {
                updatePrinterMutation.mutate({
                  ...data,
                  id: currentPrinter.id
                });
              } else {
                addPrinterMutation.mutate(data);
              }
            }}
        />
      </div>
  );
}