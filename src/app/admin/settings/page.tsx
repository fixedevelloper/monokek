"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ChefHat, CreditCard, Database, Loader2, PrinterX,
  RefreshCw, Save, ShieldCheck, Store
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {StationDialog} from "./StationDialog";
import {HubLinksCard} from "./HubLinksCard";
import {WarehouseCard} from "./WarehouseCard";
import {RegisterDialog} from "./RegisterDialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {usePrint} from "../../../hooks/use-print";
import {Printer, PrinterFormValues} from "../../../types/menus";
import {getErrorMessage} from "@/src/lib/errors";
import {useAuth} from "@/src/hooks/use-auth";
import {PERMISSIONS} from "@/src/constants/roles";
import * as kitchenStationApi from "@/src/lib/api/kitchenStation";
import * as printingApi from "@/src/lib/api/printing";
import {KitchenStation, STATION_TYPE_LABELS} from "@/src/types/kitchenStation";
import * as companyApi from "@/src/lib/api/company";
import * as cashierApi from "@/src/lib/api/cashier";
import {CashRegister} from "@/src/types/cashier";
import * as storageApi from "@/src/lib/api/storage";

interface StoreSettingsForm {
  store_name?: string;
  store_phone?: string;
  store_address?: string;
  store_bp?: string;
  store_logo?: string;
  /** Fait apparaître (ou non) le mode de paiement "Chambre" à la caisse — voir components/pos/PaymentModal.tsx. */
  room_charge_enabled?: boolean;
  /** Si false (défaut), le POS bloque la sélection d'un produit storable dont le stock est
   * épuisé — voir components/pos/PosContent.tsx. */
  allow_oversell?: boolean;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const {can} = useAuth();
  const [settings, setSettings] = useState<StoreSettingsForm>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printerToEdit, setPrinterToEdit] = useState<Printer | null>(null);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<KitchenStation | null>(null);
  const [isAddRegisterModalOpen, setIsAddRegisterModalOpen] = useState(false);
  const [registerToEdit, setRegisterToEdit] = useState<CashRegister | null>(null);
  const queryClient = useQueryClient();
  const { processPrintJob } = usePrint();
  // --- LECTURE : fetchPrinters ---
  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printingApi.listPrinters(),
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
  const addPrinterMutation = useMutation<unknown, unknown, PrinterFormValues>({
    mutationFn: (formData: PrinterFormValues) => printingApi.createPrinter(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      toast.success("Imprimante ajoutée !");
      setIsAddModalOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Erreur de validation"));
      console.error(err);
    }
  });

  // --- TEST : Tester une imprimante (Optionnel mais recommandé) ---


  const testPrinterMutation = useMutation({
    mutationFn: async (printer: Printer) => {
      if (printer.connection === "network") {
        // Vrai ticket de test ESC/POS envoyé côté serveur — voir PrinterController.testConnection.
        return await printingApi.testNetworkPrinter(printer.id);
      }

      // USB : on rejoue le même chemin qu'un vrai job (renderTicketSections + tauri-plugin-thermal-printer).
      const testReceipt = {
        orderId: 0,
        orderUuid: "test",
        reference: "TEST-PRINT",
        storeName: "Mono Kek",
        storeAddress: null,
        storePhone: null,
        storeLogoUrl: null,
        tableName: "TEST",
        serverName: "ADMIN",
        cashierName: "ADMIN",
        rounds: [{ roundNumber: 1, items: [{ productName: "TEST IMPRESSION OK", qty: 1, unitPrice: 100, total: 100, modifierNames: [] }] }],
        subtotal: 100,
        tax: 0,
        discount: 0,
        total: 100,
        paymentMethod: null,
        amountReceived: null,
        changeDue: null,
      };
      return await processPrintJob({
        id: "TEST_" + Date.now(),
        jobType: "receipt",
        osPrinterName: printer.os_printer_name || null,
        paperWidth: Number(printer.paper_width),
        content: JSON.stringify(testReceipt),
      });
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
    mutationFn: (formData: PrinterFormValues & { id: Printer['id'] }) => printingApi.updatePrinter(formData.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      toast.success("Imprimante mise à jour !");
      setPrinterToEdit(null); // Ferme le modal en réinitialisant l'état
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Erreur lors de la modification"));
    }
  });
  // --- STATIONS DE CUISINE ---
  const { data: stations = [], isLoading: isLoadingStations } = useQuery({
    queryKey: ['kitchen-stations'],
    queryFn: () => kitchenStationApi.listStationsAdmin(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-for-stations'],
    queryFn: () => companyApi.listBranches(),
  });

  const addStationMutation = useMutation({
    mutationFn: (data: { name: string; type: KitchenStation['type']; branchId: string }) => {
      if (!data.branchId) {
        throw new Error("Choisissez une succursale.");
      }
      return kitchenStationApi.createStation({ branchId: Number(data.branchId), name: data.name, type: data.type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-stations'] });
      toast.success("Station créée !");
      setIsAddStationModalOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la création")),
  });

  const updateStationMutation = useMutation({
    mutationFn: (data: { id: number; name: string; type: KitchenStation['type'] }) =>
        kitchenStationApi.updateStation(data.id, { name: data.name, type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-stations'] });
      toast.success("Station mise à jour !");
      setStationToEdit(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la modification")),
  });

  const deleteStationMutation = useMutation({
    mutationFn: (id: number) => kitchenStationApi.deleteStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-stations'] });
      toast.success("Station supprimée");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Impossible de supprimer cette station")),
  });

  const handleDeleteStation = (station: KitchenStation) => {
    if (!confirm(`Supprimer la station "${station.name}" ?`)) return;
    deleteStationMutation.mutate(station.id);
  };

  // --- CAISSES ---
  const { data: registers = [], isLoading: isLoadingRegisters } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: () => cashierApi.listRegisters(),
  });

  const addRegisterMutation = useMutation({
    mutationFn: (data: { name: string; branchId: string }) => {
      if (!data.branchId) {
        throw new Error("Choisissez une succursale.");
      }
      return cashierApi.storeRegister({ name: data.name, branchId: Number(data.branchId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success("Caisse créée !");
      setIsAddRegisterModalOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la création")),
  });

  const updateRegisterMutation = useMutation({
    mutationFn: (data: { id: number; name: string }) => cashierApi.updateRegister(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success("Caisse mise à jour !");
      setRegisterToEdit(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la modification")),
  });

  const deleteRegisterMutation = useMutation({
    mutationFn: (id: number) => cashierApi.deleteRegister(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success("Caisse supprimée");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Impossible de supprimer cette caisse")),
  });

  const handleDeleteRegister = (reg: CashRegister) => {
    if (!confirm(`Supprimer la caisse "${reg.name}" ? Impossible si elle a déjà des sessions enregistrées.`)) return;
    deleteRegisterMutation.mutate(reg.id);
  };

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


  const updateSetting = <K extends keyof StoreSettingsForm>(key: K, value: StoreSettingsForm[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
          {can(PERMISSIONS.MANAGE_SETTINGS) && (
            <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl shadow-primary/20"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
              {saving ? "En cours..." : "Sauvegarder les modifications"}
            </Button>
          )}
        </div>

        <Tabs defaultValue="printing" className="space-y-6">
          <TabsList className="bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl h-12">
            <TabsTrigger value="general" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <Store size={14} /> Succursale
            </TabsTrigger>
            <TabsTrigger value="printing" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <PrinterX size={14} /> Impression
            </TabsTrigger>
            <TabsTrigger value="stations" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <ChefHat size={14} /> Stations
            </TabsTrigger>
            <TabsTrigger value="registers" className="rounded-lg px-6 font-bold uppercase text-xs gap-2">
              <CreditCard size={14} /> Caisses
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
                  {printers.map((printer: Printer) => (
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

          {/* --- ONGLET STATIONS DE CUISINE --- */}
          <TabsContent value="stations" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ChefHat size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase italic">Stations de cuisine</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase">
                        Le type détermine par exemple quelle station alimente le Comptoir Bar
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-xl gap-2 font-bold uppercase text-[10px]" onClick={() => setIsAddStationModalOpen(true)}>
                    <Plus size={16} />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {isLoadingStations ? (
                    <Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stations.map((station) => (
                          <Card key={station.id} className="group border border-slate-100 shadow-none rounded-3xl hover:border-primary/50 transition-all duration-300">
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                  <ChefHat size={20} />
                                </div>
                                <Badge className="text-[9px] uppercase">{STATION_TYPE_LABELS[station.type]}</Badge>
                              </div>

                              <div className="space-y-1 mb-6">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{station.name}</h4>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {station.pendingTicketsCount} ticket(s) en attente
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100"
                                    onClick={() => setStationToEdit(station)}
                                >
                                  <Settings2 size={12} />
                                  Éditer
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                    onClick={() => handleDeleteStation(station)}
                                >
                                  <Trash2 size={12} />
                                  Supprimer
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                      ))}

                      <button
                          onClick={() => setIsAddStationModalOpen(true)}
                          className="group border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 transition-all gap-2"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Nouvelle Station</span>
                      </button>
                    </div>
                )}
              </CardContent>
            </Card>

            <HubLinksCard />

            <WarehouseCard />
          </TabsContent>

          {/* --- ONGLET CAISSES --- */}
          <TabsContent value="registers" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase italic">Caisses</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase">
                        Postes d'encaissement sélectionnables depuis le terminal POS
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-xl gap-2 font-bold uppercase text-[10px]" onClick={() => setIsAddRegisterModalOpen(true)}>
                    <Plus size={16} />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {isLoadingRegisters ? (
                    <Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {registers.map((reg) => (
                          <Card key={reg.id} className="group border border-slate-100 shadow-none rounded-3xl hover:border-primary/50 transition-all duration-300">
                            <CardContent className="p-5">
                              <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-4">
                                <CreditCard size={20} />
                              </div>

                              <div className="space-y-1 mb-6">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{reg.name}</h4>
                                <p className="text-[11px] text-slate-500 font-mono">ID: {reg.id}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100"
                                    onClick={() => setRegisterToEdit(reg)}
                                >
                                  <Settings2 size={12} />
                                  Éditer
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 text-[10px] uppercase font-bold border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                    onClick={() => handleDeleteRegister(reg)}
                                >
                                  <Trash2 size={12} />
                                  Supprimer
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                      ))}

                      <button
                          onClick={() => setIsAddRegisterModalOpen(true)}
                          className="group border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 transition-all gap-2"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Nouvelle Caisse</span>
                      </button>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- AUTRES ONGLETS (Simplifiés pour l'exemple) --- */}
          <TabsContent value="general">
            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardContent className="p-8">
                <div className="space-y-6">

                  {/* Nom de la boutique */}
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Nom de la boutique</Label>
                    <Input
                        value={settings.store_name || ""}
                        onChange={(e) => updateSetting('store_name', e.target.value)}
                        className="h-12 bg-slate-100 border-none rounded-xl font-bold"
                    />
                  </div>

                  {/* Téléphone, Adresse et Boite Postale (Sur 3 colonnes sur grand écran) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Téléphone */}
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase ml-1">Téléphone</Label>
                      <Input
                          type="tel"
                          value={settings.store_phone || ""}
                          onChange={(e) => updateSetting('store_phone', e.target.value)}
                          className="h-12 bg-slate-100 border-none rounded-xl font-bold"
                          placeholder="+237 ..."
                      />
                    </div>

                    {/* Adresse */}
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase ml-1">Adresse</Label>
                      <Input
                          value={settings.store_address || ""}
                          onChange={(e) => updateSetting('store_address', e.target.value)}
                          className="h-12 bg-slate-100 border-none rounded-xl font-bold"
                          placeholder="Ex: Rue Joss, Douala"
                      />
                    </div>

                    {/* Boite Postale (BP) */}
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase ml-1">Boite Postale (BP)</Label>
                      <Input
                          value={settings.store_bp || ""}
                          onChange={(e) => updateSetting('store_bp', e.target.value)}
                          className="h-12 bg-slate-100 border-none rounded-xl font-bold"
                          placeholder="Ex: BP 1234"
                      />
                    </div>
                  </div>

                  ---

                  {/* Mode Chambre (facturation hôtel via pms-modulith) */}
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label className="text-[10px] font-black uppercase ml-1">Mode Chambre</Label>
                      <p className="text-xs text-muted-foreground font-medium mt-1 max-w-md">
                        Affiche l'option de paiement "Chambre" à la caisse (facturation au folio d'un client
                        d'hôtel via l'intégration PMS). À activer uniquement si cet établissement gère un hôtel.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.room_charge_enabled)}
                      onCheckedChange={(checked) => updateSetting('room_charge_enabled', checked)}
                    />
                  </div>

                  {/* Vente en stock insuffisant (produits storable) */}
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label className="text-[10px] font-black uppercase ml-1">Vente en stock insuffisant</Label>
                      <p className="text-xs text-muted-foreground font-medium mt-1 max-w-md">
                        Autorise la vente d'un produit dont le stock est épuisé. Si désactivé, le
                        POS bloque la sélection du produit avec un message d'erreur.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.allow_oversell)}
                      onCheckedChange={(checked) => updateSetting('allow_oversell', checked)}
                    />
                  </div>

                  {/* Logo de la boutique */}
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Logo de la boutique</Label>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      {settings.store_logo && (
                          <img
                              src={settings.store_logo}
                              alt="Logo preview"
                              className="w-16 h-16 object-cover rounded-xl bg-white border shadow-sm"
                          />
                      )}
                      <Input
                          type="file"
                          accept="image/*"
                          disabled={uploadingLogo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;

                            if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
                              toast.error("Format non supporté (jpeg, png, webp, gif uniquement)");
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Fichier trop volumineux (5 Mo maximum)");
                              return;
                            }

                            // Uploadé vers MinIO (voir storageApi.uploadImage) : on ne stocke qu'une URL dans
                            // le réglage `store_logo`, pas l'image encodée en base64 — la colonne `settings.value`
                            // est un TEXT MySQL (64 Ko max), qu'un base64 d'image dépasse presque toujours,
                            // ce qui faisait échouer TOUT l'enregistrement des réglages (transaction unique).
                            setUploadingLogo(true);
                            try {
                              const url = await storageApi.uploadImage(file, "store");
                              updateSetting('store_logo', url);
                              toast.success("Logo envoyé !");
                            } catch {
                              toast.error("Échec de l'envoi du logo");
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                          className="h-12 bg-white border-slate-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer pt-2"
                      />
                      {uploadingLogo && <span className="text-[10px] font-bold uppercase text-slate-400">Envoi en cours...</span>}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        <PrinterDialog
            branches={branches}
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
        <StationDialog
            open={!!stationToEdit || isAddStationModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                setStationToEdit(null);
                setIsAddStationModalOpen(false);
              }
            }}
            initialData={stationToEdit}
            branches={branches}
            isPending={addStationMutation.isPending || updateStationMutation.isPending}
            onSubmit={(data) => {
              if (stationToEdit) {
                updateStationMutation.mutate({ id: stationToEdit.id, ...data });
              } else {
                addStationMutation.mutate(data);
              }
            }}
        />
        <RegisterDialog
            open={!!registerToEdit || isAddRegisterModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                setRegisterToEdit(null);
                setIsAddRegisterModalOpen(false);
              }
            }}
            initialData={registerToEdit}
            branches={branches}
            isPending={addRegisterMutation.isPending || updateRegisterMutation.isPending}
            onSubmit={(data) => {
              if (registerToEdit) {
                updateRegisterMutation.mutate({ id: registerToEdit.id, ...data });
              } else {
                addRegisterMutation.mutate(data);
              }
            }}
        />
      </div>
  );
}