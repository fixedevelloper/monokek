// src/lib/storage.ts
import {isTauri} from "./axios";

let store: any = null;

export const initStore = async () => {
    try {
        //const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

        if (isTauri) {
            const { load } = await import("@tauri-apps/plugin-store");
            store = await load(".settings.json", {
                autoSave: true,
                defaults: {}
            });
        }
    } catch (e) {
        console.warn("Store Tauri indisponible, fallback localStorage");
    }
};

export const saveLocalSettings = async (settings: any) => {
    if (store) {
        await store.set("settings", settings);
        await store.save();
    } else {
        localStorage.setItem("settings", JSON.stringify(settings));
    }
};

export const getLocalSettings = async () => {
    if (store) {
        return await store.get("settings");
    } else {
        const data = localStorage.getItem("settings");
        return data ? JSON.parse(data) : null;
    }
};