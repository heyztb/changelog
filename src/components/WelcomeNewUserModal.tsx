import { TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface WelcomeNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeNewUserModal({
  isOpen,
  onClose,
}: WelcomeNewUserModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome to Changelog
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Every great project starts with small daily wins. This is where
              you'll track yours.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              What did you make progress on today?
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
            onClick={onClose}
          >
            Let's Go<span>🚢</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
