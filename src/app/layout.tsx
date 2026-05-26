'use client'
import {Inter} from "next/font/google";
import "./globals.css";

import {ThemeProvider} from "@/components/theme-provider";
//import Sidebar from "@/components/layout/Sidebar";
import {Toaster} from "sonner";
import LockScreen from "./(auth)/lock/page";
import QueryProvider from "../providers/QueryProvider";
import {TooltipProvider} from "@/components/ui/tooltip"
import PaymentModal from "@/components/pos/PaymentModal";
import {useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {cn} from "@/lib/utils";
import {LicenseGuard} from "../../components/layout/LicenseGuard";
import {usePrint} from "../hooks/use-print";
import {useEcho} from "../hooks/useEcho";
import {getLocalSettings} from "../lib/storage";
import {EchoProvider} from "../providers/EchoContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const { processPrintJob, checkPendingJobs } = usePrint();
  const echo = useEcho();

  useEffect(() => {
    let channel: any = null;

    const setupRealtimePrinting = async () => {
      const settings = await getLocalSettings();
      const branchId = settings?.branch_id;

      if (echo && branchId) {
        console.log(`[Printer] 🎧 Écoute active sur la branche: ${branchId}`);

        // 1. Écoute des nouveaux jobs en temps réel
        channel = echo.channel(`branch.${branchId}`)
            .listen('.PrintJobCreated', (e: any) => {
              console.log("[Printer] 🚀 Signal reçu via Socket pour le job:", e.job.id);
              processPrintJob(e.job);
            });
      }
    };

    setupRealtimePrinting();

    // 2. Polling de sécurité (toutes les 60 secondes)
    // Utile si le socket a été déconnecté momentanément
    const interval = setInterval(() => {
      console.log("[Printer] 🔍 Vérification périodique des jobs en attente...");
      checkPendingJobs();
    }, 60000);

    return () => {
      if (channel) channel.stopListening('.PrintJobCreated');
      clearInterval(interval);
    };
  }, [echo]);
  useEffect(() => {
    const checkConfig = async () => {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

      if (isTauri) {
        try {
          // Utilisation de load() selon la doc V2
          const { load } = await import("@tauri-apps/plugin-store");
          const store = await load(".settings.json", {
            autoSave: true,
            defaults: {}
          });

          const savedIp = await store.get<string>("backend-ip");

          if (!savedIp && pathname !== '/setup') {
            router.push('/setup');
          } else {
            setIsReady(true);
          }
        } catch (e) {
          console.error("Erreur Store V2:", e);
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    };

    checkConfig();
  }, [pathname, router]);

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased overflow-hidden pt-[env(safe-area-inset-top)]", inter.className)}>
        <div className="h-[env(safe-area-inset-top)] w-full" />
        <QueryProvider>
          <LicenseGuard>
          <ThemeProvider attribute="class" defaultTheme="light">
            <EchoProvider>
            <TooltipProvider>

              {/* On n'affiche le contenu que lorsque la vérification IP est faite */}
              {isReady ? (
                <div className="flex h-screen w-screen overflow-hidden">
                  <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                    <div className="flex-1 overflow-auto">
                      {children}
                    </div>
                  </main>
                </div>
              ) : (
                // Optionnel : Un loader minimaliste pendant la vérification
                <div className="h-screen w-screen flex items-center justify-center bg-background">
                  <div className="animate-pulse font-black uppercase italic tracking-tighter text-2xl">
                    Mono-Kek <span className="text-primary text-sm">Loading...</span>
                  </div>
                </div>
              )}

              <LockScreen />
              <PaymentModal />

            </TooltipProvider>
            </EchoProvider>
          </ThemeProvider>
          </LicenseGuard>
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}