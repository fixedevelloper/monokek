import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLicense } from "./useLicense";

export function useLicenseWatcher() {
    // On récupère directement la fonction refetch du hook useLicense
    const { data: status, refetch } = useLicense();

    useEffect(() => {
        // Intervalle de 1 minute pour le test
        const interval = setInterval(async () => {
            console.log("Tauri: Forçage du check licence...");

            // refetch() renvoie une promesse et force l'appel API
            await refetch();

        }, 30*60 * 1000);

        return () => clearInterval(interval);
    }, [refetch]); // On dépend de refetch

    return status;
}