import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/use-auth-store';

// Configuration de Laravel Echo
// Note: Dans Tauri, window.Pusher est nécessaire pour Echo
if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

const echo = new Echo({
    broadcaster: 'reverb', // Ou 'pusher' selon ta config Laravel
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 80,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 443,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

export const usePosSocket = () => {
    const { user } = useAuthStore();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !user.branch_id) return;

        // 1. Canal spécifique à la succursale (Branch)
        const channelName = `branch.${user.branch_id}`;

        // 2. Écouter les nouvelles commandes (Pour la Cuisine / KDS)
        echo.channel(channelName)
            .listen('.OrderCreated', (data: any) => {
                if (user.role === 'kitchen' || user.role === 'admin') {
                    toast({
                        title: "NOUVELLE COMMANDE 🍽️",
                        description: `Table ${data.order.table_name || 'Emporter'} - Réf: ${data.order.reference}`,
                    });
                    // Ici, tu peux déclencher un rafraîchissement des données via React Query
                }
            })
            // 3. Écouter les changements de statut (Pour les Serveurs)
            .listen('.OrderReady', (data: any) => {
                if (user.role === 'waiter' || user.role === 'admin') {
                    toast({
                        title: "COMMANDE PRÊTE ✅",
                        description: `La commande ${data.order.reference} est prête à être servie !`,
                        variant: "default",
                    });
                }
            });

        return () => {
            echo.leave(channelName);
        };
    }, [user, toast]);

    return { echo };
};