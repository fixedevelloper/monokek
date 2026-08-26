import { getLocalSettings } from "./storage";
import * as cashierApi from "./api/cashier";
import { useAuthStore } from "../store/use-auth-store";

/**
 * Resolves the branch this terminal operates in. `settings.branch_id` /
 * `localStorage["user_branch_id"]` are checked first as an explicit override
 * (nothing writes them yet, kept for when that's wired up), then the logged-in
 * user's own `branch_id` (from `/api/me`, already in the auth store — the
 * authoritative source, present for every staff account regardless of role).
 * Falls back to the branch of whichever cash register the backend knows about
 * only as a last resort for accounts with no assigned branch (e.g. an
 * unscoped admin) — that fallback previously ran FIRST, which meant a kitchen
 * terminal with no cash register configured in its branch never resolved a
 * branchId at all, so `NotificationsProvider` retried forever and the SSE
 * connection never opened. Returns `null` if nothing has an answer yet (not
 * authenticated, no branch assigned, no register configured either).
 */
export async function resolveBranchId(): Promise<string | number | null> {
    const settings = await getLocalSettings();
    if (settings?.branch_id) {
        return settings.branch_id as string | number;
    }
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_branch_id");
        if (stored) {
            return stored;
        }
    }
    const userBranchId = useAuthStore.getState().user?.branch_id;
    if (userBranchId) {
        return userBranchId;
    }
    try {
        const registers = await cashierApi.listRegisters();
        if (registers[0]) {
            return registers[0].branch_id;
        }
    } catch {
        // Not authenticated yet, or no register configured — caller decides how to retry.
    }
    return null;
}
