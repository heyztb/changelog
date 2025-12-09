import { useEffect } from "react";
import { CreateProjectForm } from "./CreateProjectForm";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onConfirm,
}: CreateProjectModalProps) {
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
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          onClose();
        }}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-800 rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-neutral-700">
        <CreateProjectForm />
      </div>
    </div>
  );
}
