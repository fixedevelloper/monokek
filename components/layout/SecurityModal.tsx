import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

interface SecurityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePin: (newPin: string) => Promise<void>;
  onUpdatePassword: (oldPass: string, newPass: string) => Promise<void>;
}

export function SecurityModal({ 
  isOpen, 
  onOpenChange, 
  onUpdatePin, 
  onUpdatePassword 
}: SecurityModalProps) {
  const [loading, setLoading] = useState(false);
  
  // States pour les formulaires
  const [pin, setPin] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      await onUpdatePin(pin);
      onOpenChange(false);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setLoading(true);
    try {
      await onUpdatePassword(oldPassword, newPassword);
      onOpenChange(false);
      setOldPassword("");
      setNewPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden bg-white">
        {/* Header Stylé */}
        <div className="bg-slate-950 p-6 text-white relative overflow-hidden">
          <ShieldCheck className="absolute -right-4 -top-4 h-24 w-24 text-white/5 rotate-12" />
          <h2 className="text-xl font-black uppercase italic tracking-tighter relative z-10">
            Sécurité Compte
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 relative z-10">
            Mettre à jour vos accès
          </p>
        </div>

        <Tabs defaultValue="pin" className="p-6">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-xl h-11 p-1">
            <TabsTrigger value="pin" className="font-bold text-[10px] uppercase rounded-lg transition-all data-[state=active]:shadow-sm">
              Code PIN
            </TabsTrigger>
            <TabsTrigger value="password" className="font-bold text-[10px] uppercase rounded-lg transition-all data-[state=active]:shadow-sm">
              Mot de passe
            </TabsTrigger>
          </TabsList>

          {/* Formulaire PIN */}
          <TabsContent value="pin" className="space-y-4 focus-visible:outline-none">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Nouveau Code PIN (4 chiffres)
              </Label>
              <Input 
                type="password" 
                inputMode="numeric"
                maxLength={4} 
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••" 
                className="h-14 bg-muted/50 border-none text-center text-3xl tracking-[0.5em] font-black focus-visible:ring-primary rounded-2xl"
              />
            </div>
            <Button 
              onClick={handlePinSubmit}
              disabled={loading || pin.length < 4}
              className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Mettre à jour le PIN"}
            </Button>
          </TabsContent>

          {/* Formulaire Mot de Passe */}
          <TabsContent value="password" className="space-y-4 focus-visible:outline-none">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Ancien mot de passe</Label>
                <Input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="h-11 bg-muted/50 border-none rounded-xl focus-visible:ring-primary" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Nouveau mot de passe</Label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 bg-muted/50 border-none rounded-xl focus-visible:ring-primary" 
                />
              </div>
            </div>
            <Button 
              onClick={handlePasswordSubmit}
              disabled={loading || !newPassword || !oldPassword}
              className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 mt-2 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Changer le mot de passe"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}