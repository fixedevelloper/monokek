import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/src/lib/axios";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useCashStore } from "@/src/store/use-cash-store";
import { Banknote, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CashOpenModal() {
  const [amount, setAmount] = useState('');
  const { setSession } = useCashStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
const logout = useAuthStore((state) => state.logout); // On suppose que tu as une action logout

const handleLogout = () => {
    logout();
    router.push('/login');
};
const handleOpenRegister = async () => {
    setLoading(true);
    try {
        const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
        let registerId;

        if (isTauri) {
            const { load } = await import("@tauri-apps/plugin-store");
           const store = await load(".settings.json", {
  autoSave: true,
  defaults: {}
});
            registerId = await store.get("register-id");
        } else {
            registerId = localStorage.getItem("register-id");
        }

        const response = await api.post('api/cash/open', {
            opening_amount: parseFloat(amount) || 0,
            register_id: registerId // Utilise l'ID stocké au démarrage
        });
        
        setSession(response.data);
        toast.success("Session de caisse démarrée");
    } catch (error) {
        console.log(error)
        toast.error("Vérifiez l'ID de caisse ou le montant");
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="h-20 w-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
            <Banknote size={40} />
          </div>
          
          <div>
            <h2 className="text-3xl font-serif font-bold text-stone-900 italic">Ouverture de Caisse</h2>
            <p className="text-stone-500 mt-2">Saisissez le fond de caisse initial (FCFA)</p>
          </div>

          <div className="w-full space-y-6">
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-stone-300">FCFA</span>
              <Input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-20 pl-20 pr-6 rounded-3xl bg-stone-50 border-none text-3xl font-mono font-black text-stone-900"
              />
            </div>

            <Button 
              onClick={handleOpenRegister}
              disabled={loading}
              className="w-full h-16 rounded-3xl bg-stone-900 hover:bg-stone-800 text-white font-black uppercase tracking-widest text-lg transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirmer l'ouverture"}
            </Button>
              <Button 
              onClick={handleLogout}
              disabled={loading}
              className="w-full h-16 rounded-3xl bg-red-900 hover:bg-red
              -800 text-white font-black uppercase tracking-widest text-lg transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Quitter"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}