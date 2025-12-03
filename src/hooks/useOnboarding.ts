// changelog/src/hooks/useOnboarding.ts
import { useCallback, useEffect, useState } from "react";
import { hasUserOnboarded, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

/**
 * useOnboarding
 *
 * Centralizes onboarding state and localStorage logic.
 *
 * - `isOnboarded` reflects whether the user completed onboarding.
 * - `completeOnboarding()` marks onboarding complete (persists to localStorage).
 * - `resetOnboarding()` clears the flag (useful for testing/dev).
 *
 * The hook is defensive around localStorage access (e.g. SSR or restrictive environments).
 */
export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return hasUserOnboarded();
    } catch {
      // If localStorage or utils access fails for any reason, default to not onboarded.
      return false;
    }
  });

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      /* ignore storage errors */
    }
    setIsOnboarded(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
    setIsOnboarded(false);
  }, []);

  useEffect(() => {
    // Keep state in sync if another tab changes onboarding status.
    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDING_STORAGE_KEY) {
        setIsOnboarded(e.newValue === "true");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    isOnboarded,
    completeOnboarding,
    resetOnboarding,
  } as const;
}
