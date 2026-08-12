import { getLocalSettings } from "./storage";
import * as cashierApi from "./api/cashier";

/**
 * Resolves the branch this terminal operates in. `settings.branch_id` /
 * `localStorage["user_branch_id"]` are checked first as an explicit override
 * (nothing writes them yet, kept for when that's wired up), falling back to
 * the branch of whichever cash register the backend already knows about —
 * `/api/cash/registers` needs no special role, so it resolves correctly for
 * waiter/cashier/kitchen accounts too, not just admins. Returns `null` if
 * neither source has an answer yet (not authenticated, no register configured).
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
