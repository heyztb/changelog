import { useCallback, useEffect, useState } from "react";
import { hasUserOnboarded, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return hasUserOnboarded();
    } catch {
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
