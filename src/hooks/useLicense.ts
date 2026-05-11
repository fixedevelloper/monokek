import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export interface LicenseStatus {
    active: boolean;
    expired: boolean;
    license_key: string;
    expiry_date: string;
    days_left: number;
    error?: string;
}

export const useLicense = () => {
    return useQuery<LicenseStatus>({
        queryKey: ["license-status"],
        queryFn: async () => {
            const res = await api.get("/api/license/status");
            return res.data;
        },
        // On vérifie le statut toutes les 30 minutes au cas où la licence expire en plein milieu
        refetchInterval: 1000 * 60 * 30,
        retry: false,
    });
};