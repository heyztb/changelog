/**
 * changelog/src/hooks/useTagline.ts
 *
 * Hook: useTagline
 *
 * Purpose:
 * - Provide a stable tagline across mounts during a single browser session.
 * - Persist the tagline to sessionStorage so that route changes / remounts in the same session
 *   display the same tagline.
 * - Regenerate the tagline when onboarding state changes (listens for storage events).
 *
 * API:
 * - const { tagline, refresh } = useTagline();
 *   - `tagline`: current tagline string
 *   - `refresh()`: regenerate a new tagline and persist it to sessionStorage
 *
 * Notes:
 * - Defensive about sessionStorage/localStorage access (try/catch) for environments
 *   where storage is restricted (SSR, private mode, etc.).
 */

import { useCallback, useEffect, useState } from "react";
import { getTagline, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

const SESSION_TAGLINE_KEY = "changelog-session-tagline";

/**
 * Safely read a tagline from sessionStorage. Returns string | null.
 */
function readStoredTagline(): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const v = sessionStorage.getItem(SESSION_TAGLINE_KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely persist a tagline to sessionStorage (no-op on error).
 */
function persistTagline(value: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(SESSION_TAGLINE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export function useTagline() {
  const [tagline, setTagline] = useState<string>(() => {
    // Try to reuse an existing tagline from sessionStorage if possible.
    const stored = readStoredTagline();
    if (stored !== null) return stored;

    // Fallback: compute a new tagline (getTagline is defensive itself).
    try {
      // Ensure we always return a string (guard against unexpected undefined)
      const t = getTagline();
      return t || "Build in public";
    } catch {
      return "Build in public";
    }
  });

  // Ensure tagline is persisted whenever it changes.
  useEffect(() => {
    persistTagline(tagline);
  }, [tagline]);

  // Regenerate tagline on-demand.
  const refresh = useCallback(() => {
    // Guard getTagline result to ensure a string is always used.
    const next = getTagline() || "Build in public";
    setTagline(next);
    persistTagline(next);
  }, []);

  // If onboarding status changes in another tab/window, refresh the tagline
  // because onboarding changes the pool of candidate taglines.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDING_STORAGE_KEY) {
        // onboarding flag changed: regenerate tagline
        const next = getTagline() || "Build in public";
        setTagline(next);
        persistTagline(next);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { tagline, refresh } as const;
}

export default useTagline;
