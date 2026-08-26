import { isTauri } from "./axios";

const STORAGE_KEY = "setup-pin-hash";

/**
 * SHA-256 du PIN, jamais le PIN en clair sur disque. Ceci dit un hash simple
 * d'un espace à 10 000 valeurs (4 chiffres) ne résiste pas à un attaquant qui
 * a un accès complet au poste (lecture du store + calcul local) — cette porte
 * sert à dissuader une manipulation occasionnelle du réglage, pas à faire
 * office de coffre-fort. Le vrai verrou reste côté backend pour tout ce qui
 * touche à un compte utilisateur réel.
 */
async function hashPin(pin: string): Promise<string> {
    const data = new TextEncoder().encode(pin);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readStoredHash(): Promise<string | null> {
    if (isTauri) {
        const { load } = await import("@tauri-apps/plugin-store");
        const store = await load(".settings.json", { autoSave: true, defaults: {} });
        return (await store.get<string>(STORAGE_KEY)) ?? null;
    }
    return localStorage.getItem(STORAGE_KEY);
}

export async function hasSetupPin(): Promise<boolean> {
    return (await readStoredHash()) !== null;
}

export async function verifySetupPin(candidate: string): Promise<boolean> {
    const stored = await readStoredHash();
    if (!stored) return false;
    return (await hashPin(candidate)) === stored;
}

export async function setSetupPin(pin: string): Promise<void> {
    const hash = await hashPin(pin);
    if (isTauri) {
        const { load } = await import("@tauri-apps/plugin-store");
        const store = await load(".settings.json", { autoSave: true, defaults: {} });
        await store.set(STORAGE_KEY, hash);
        await store.save();
    } else {
        localStorage.setItem(STORAGE_KEY, hash);
    }
}
