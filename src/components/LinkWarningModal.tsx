import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface LinkWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LinkWarningModal({
  isOpen,
  onClose,
  onConfirm,
}: LinkWarningModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem("skip-link-warning", "true");
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              External Link
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This link takes you to an external website. Always be cautious
              when sharing personal information or connecting your wallet.
            </p>
          </div>

          <div className="w-full pt-2 space-y-2">
            <Button
              className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 h-10 rounded-xl"
              onClick={handleConfirm}
            >
              Continue
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
            />
            <label
              htmlFor="dont-show"
              className="text-xs text-gray-500 cursor-pointer select-none"
            >
              Don't show this warning again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
