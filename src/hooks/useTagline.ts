import { useCallback, useEffect, useRef, useState } from "react";
import { getTagline, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

const SESSION_TAGLINE_KEY = "changelog-session-tagline";
// Consider a stored tagline stale after this many milliseconds (default: 4 hours)
const TTL_MS = 4 * 60 * 60 * 1000;

type StoredTagline = {
  value: string;
  ts: number;
};

/**
 * Read a tagline entry from sessionStorage.
 * Supports legacy plain-string values by returning a ts of 0 (treated as stale).
 */
function readStoredTagline(): StoredTagline | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_TAGLINE_KEY);
    if (!raw) return null;

    // Try JSON first
    try {
      const parsed = JSON.parse(raw) as StoredTagline | null;
      if (
        parsed &&
        typeof parsed.value === "string" &&
        typeof parsed.ts === "number"
      ) {
        return parsed;
      }
    } catch {
      // Not JSON -> fallthrough to legacy support
    }

    // Legacy plain string support: set ts = 0 so callers know it's stale
    return { value: raw, ts: 0 };
  } catch {
    return null;
  }
}

/** Persist tagline to sessionStorage as JSON { value, ts } */
function persistTagline(value: string, ts = Date.now()): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    const payload: StoredTagline = { value, ts };
    sessionStorage.setItem(SESSION_TAGLINE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

/** Whether a timestamp is considered stale */
function isStale(ts: number | null | undefined): boolean {
  if (typeof ts !== "number") return true;
  return Date.now() - ts > TTL_MS;
}

/**
 * Hook: useTagline
 *
 * Important:
 * - Avoids calling `getTagline()` during render.
 * - Initializes state from sessionStorage synchronously (safe).
 * - Runs `getTagline()` inside effects (on mount / visibility / refresh) to update when appropriate.
 */
export function useTagline() {
  // Read stored tagline synchronously for initial render only.
  const initialStored = (() => {
    try {
      return readStoredTagline();
    } catch {
      return null;
    }
  })();

  // Initialize visible tagline from storage or fallback default.
  const [tagline, setTagline] = useState<string>(
    () => initialStored?.value ?? "Build in public",
  );

  // Timestamp ref (seeded with stored timestamp if available).
  const tsRef = useRef<number | null>(initialStored?.ts ?? null);

  // Persist whenever tagline changes (updates stored timestamp too).
  useEffect(() => {
    const now = Date.now();
    tsRef.current = now;
    persistTagline(tagline, now);
  }, [tagline]);

  // refresh() intentionally calls getTagline() from inside a callback/effect.
  const refresh = useCallback(() => {
    try {
      const next = getTagline() || "Build in public";
      setTagline((prev) => {
        if (prev === next) {
          // update timestamp even if unchanged so TTL is refreshed
          const now = Date.now();
          tsRef.current = now;
          persistTagline(next, now);
          return prev;
        }
        const now = Date.now();
        tsRef.current = now;
        persistTagline(next, now);
        return next;
      });
    } catch {
      // ignore failures in getTagline()
    }
  }, []);

  // On mount: if stored tagline is missing or stale, compute a fresh one.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If we have a stored timestamp and it's fresh, no immediate action needed.
    if (!isStale(tsRef.current)) {
      return;
    }

    // Otherwise compute and adopt a fresh tagline asynchronously.
    let cancelled = false;
    try {
      // Defer work slightly so we don't synchronously update during mount render.
      const id = window.setTimeout(() => {
        if (cancelled) return;
        try {
          const next = getTagline() || "Build in public";
          setTagline((prev) => {
            if (prev === next) {
              const now = Date.now();
              tsRef.current = now;
              persistTagline(next, now);
              return prev;
            }
            const now = Date.now();
            tsRef.current = now;
            persistTagline(next, now);
            return next;
          });
        } catch {
          // ignore
        }
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    } catch {
      // ignore
    }
  }, []);

  // Listen for storage events from other tabs and onboarding changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === ONBOARDING_STORAGE_KEY) {
          // Onboarding state changed -> re-evaluate tagline
          try {
            const next = getTagline() || "Build in public";
            setTagline(next);
            const now = Date.now();
            tsRef.current = now;
            persistTagline(next, now);
          } catch {
            // ignore
          }
          return;
        }

        if (e.key === SESSION_TAGLINE_KEY) {
          const stored = readStoredTagline();
          if (!stored) return;
          // If incoming stored tagline is fresher and not stale, adopt it.
          if (tsRef.current == null || stored.ts > (tsRef.current ?? 0)) {
            if (isStale(stored.ts)) {
              // incoming value itself is stale -> compute fresh
              refresh();
            } else {
              setTagline(stored.value);
              tsRef.current = stored.ts;
            }
          }
        }
      } catch {
        // swallow errors
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // When page becomes visible, if stored tagline is stale compute fresh one.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const stored = readStoredTagline();
        if (stored && !isStale(stored.ts)) {
          // adopt fresher stored tagline if it differs
          if (stored.value !== tagline) {
            setTagline(stored.value);
            tsRef.current = stored.ts;
          }
        } else {
          // stored absent or stale -> refresh
          refresh();
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh, tagline]);

  return { tagline, refresh } as const;
}
