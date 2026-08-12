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
import {NotificationsProvider} from "../providers/NotificationsProvider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

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
            <NotificationsProvider>
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
            </NotificationsProvider>
          </ThemeProvider>
          </LicenseGuard>
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}