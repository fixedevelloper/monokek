'use client'
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
//import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import LockScreen from "./(auth)/lock/page";
import QueryProvider from "../providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip"
import PaymentModal from "@/components/pos/PaymentModal";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkConfig = async () => {
      // 1. Ne pas vérifier si on est déjà sur la page /setup
      if (pathname === '/setup') return;

      try {
        const { Store } = await import("tauri-plugin-store-api");
        const store = new Store(".settings.dat");
        const savedIp = await store.get("backend-ip");
        console.log(savedIp)
        // 2. Si aucune IP n'est stockée, on redirige vers /setup
        if (!savedIp) {
          router.push('/setup');
        }
      } catch (e) {
        // Si on est dans un navigateur (hors Tauri), on ignore ou on gère différemment
        console.warn("Environnement hors-Tauri détecté");
      }
    };

    checkConfig();
  }, [pathname, router]);
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-hidden",
          inter.className
        )}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>

      
            {/* Conteneur principal flexible */}
            <div className="flex h-screen w-screen overflow-hidden">
              
              {/* Sidebar fixe à gauche 
              <Sidebar />*/}

              {/* Zone de contenu dynamique */}
              <main className="flex-1 flex flex-col min-w-0 bg-background relative">
       
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </main>

            </div>
            <LockScreen />
            <PaymentModal />
            {/* Couche de notifications globale */}
           <Toaster position="top-right" />
                  </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}