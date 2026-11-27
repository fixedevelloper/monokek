import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a function that runs `action` AT MOST once per `intervalMs`, however often it is called.
 *
 * The first call runs at once (a ticket that just became "ready" must show immediately); calls arriving during the window collapse into ONE more
 * run when it ends, so the screen always ends on the latest state. Why: every order or ticket event reaches every terminal of the branch and each
 * screen used to refetch its whole list on EACH of them — about six refetches per order per terminal; with two dozen terminals that storm slowed
 * the server ten-fold and delayed the very notifications that started it.
 */
export function useCoalescedCallback(action: () => void, intervalMs = 2000): () => void {
  const actionRef = useRef(action);
  actionRef.current = action;
  const windowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (windowRef.current) clearTimeout(windowRef.current);
      windowRef.current = null;
    };
  }, []);

  return useCallback(() => {
    const run = () => {
      pendingRef.current = false;
      windowRef.current = setTimeout(() => {
        windowRef.current = null;
        if (pendingRef.current && aliveRef.current) run();
      }, intervalMs);
      actionRef.current();
    };
    if (windowRef.current === null) run();
    else pendingRef.current = true;
  }, [intervalMs]);
}
