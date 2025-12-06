import { useCallback, useEffect, useState } from "react";
import { getTagline, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

const SESSION_TAGLINE_KEY = "changelog-session-tagline";

function readStoredTagline(): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const v = sessionStorage.getItem(SESSION_TAGLINE_KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

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
    const stored = readStoredTagline();
    if (stored !== null) return stored;

    try {
      const t = getTagline();
      return t || "Build in public";
    } catch {
      return "Build in public";
    }
  });

  useEffect(() => {
    persistTagline(tagline);
  }, [tagline]);

  const refresh = useCallback(() => {
    const next = getTagline() || "Build in public";
    setTagline(next);
    persistTagline(next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDING_STORAGE_KEY) {
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
