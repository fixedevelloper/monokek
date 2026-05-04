"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function QueryProvider({ children }: { children: React.ReactNode }) {

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dans un restaurant, on veut des données fraîches
            staleTime: 1000 * 60 * 5, // Les données sont considérées "périmées" après 5 min
            gcTime: 1000 * 60 * 60 * 24, // Garder en mémoire cache pendant 24h
            retry: 2, // Réessayer 2 fois en cas d'échec réseau
            refetchOnWindowFocus: true, // Rafraîchir quand on revient sur l'app Tauri
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Outils de debug (uniquement en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}