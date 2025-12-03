// changelog/src/hooks/useLinkWarning.ts
import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * useLinkWarning
 *
 * Centralizes external link confirmation logic used across routes and components.
 *
 * Usage:
 * const {
 *   showLinkWarning,
 *   setShowLinkWarning,
 *   pendingLink,
 *   handleLinkClick,
 *   handleConfirmLink,
 *   handleCancel,
 * } = useLinkWarning();
 *
 * - Call `handleLinkClick(e, url)` from anchor click handlers to intercept navigation.
 * - Render a shared `LinkWarningModal` controlled by `showLinkWarning`.
 * - Call `handleConfirmLink()` when the user confirms (modal Continue).
 * - Call `handleCancel()` when the user cancels (modal Close).
 */
export function useLinkWarning() {
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
      // Prevent default navigation so we can decide what to do.
      e.preventDefault();

      // If the user has opted out of the warning, open immediately.
      try {
        if (localStorage.getItem(STORAGE_KEYS.SKIP_LINK_WARNING) === "true") {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
      } catch (err) {
        // If localStorage isn't available for some reason, fall back to showing the warning.
        // We intentionally swallow the error to avoid breaking UX.
        // eslint-disable-next-line no-console
        console.warn("useLinkWarning: could not read localStorage", err);
      }

      setPendingLink(url);
      setShowLinkWarning(true);
    },
    [],
  );

  const handleConfirmLink = useCallback(() => {
    if (!pendingLink) return;

    // Open the pending link in a new tab and clear state.
    try {
      window.open(pendingLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("useLinkWarning: failed to open link", err);
    } finally {
      setShowLinkWarning(false);
      setPendingLink(null);
    }
  }, [pendingLink]);

  const handleCancel = useCallback(() => {
    setShowLinkWarning(false);
    setPendingLink(null);
  }, []);

  return {
    showLinkWarning,
    setShowLinkWarning,
    pendingLink,
    handleLinkClick,
    handleConfirmLink,
    handleCancel,
  } as const;
}
