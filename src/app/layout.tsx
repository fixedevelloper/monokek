'use client'
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
//import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import LockScreen from "./(auth)/lock/page";
import QueryProvider from "../providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip"
import PaymentModal from "@/components/pos/PaymentModal";
const inter = Inter({ subsets: ["latin"] });
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

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
      <body className={cn("min-h-screen bg-background font-sans antialiased overflow-hidden", inter.className)}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
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
              <Toaster position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}