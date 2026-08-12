import { AxiosError } from "axios";

/**
 * Extrait un message d'erreur exploitable côté UI, en priorisant le message
 * renvoyé par l'API (`{ message: string }`) sur les erreurs Axios.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) return data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}
