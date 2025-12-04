import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export function useLinkWarning() {
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
      e.preventDefault();

      try {
        if (localStorage.getItem(STORAGE_KEYS.SKIP_LINK_WARNING) === "true") {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
      } catch (err) {
        console.warn("useLinkWarning: could not read localStorage", err);
      }

      setPendingLink(url);
      setShowLinkWarning(true);
    },
    [],
  );

  const handleConfirmLink = useCallback(() => {
    if (!pendingLink) return;

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
