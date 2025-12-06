import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";

type ProjectSelectorProps = {
  selectedProject: string | null;
  onSelectProject: (project: string | null) => void;
  projects: string[];
  addProject: (name: string) => boolean | void;
  isLoaded: boolean;
  className?: string;
};

export default function ProjectSelector({
  selectedProject,
  onSelectProject,
  projects,
  addProject,
  isLoaded,
  className = "",
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowNewProjectInput(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showNewProjectInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewProjectInput]);

  const toggleSelect = (project: string) => {
    if (selectedProject === project) {
      onSelectProject(null);
    } else {
      onSelectProject(project);
    }
    setOpen(false);
    setShowNewProjectInput(false);
    setNewProjectName("");
  };

  const handleCreateProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const result = addProject(trimmed);
    // if addProject returns boolean, check it; otherwise assume success.
    const success = typeof result === "boolean" ? result : true;
    if (success) {
      onSelectProject(trimmed);
      setOpen(false);
      setShowNewProjectInput(false);
      setNewProjectName("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen((s) => !s);
          setShowNewProjectInput(false);
          setNewProjectName("");
        }}
        className={`rounded-full h-9 px-3 hover:bg-gray-100 dark:hover:bg-neutral-700 ${
          selectedProject
            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
            : "text-gray-600 dark:text-gray-300"
        }`}
      >
        {selectedProject || "Select project"}
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50 overflow-hidden">
          <div className="py-2">
            {isLoaded && projects.length === 0 && !showNewProjectInput && (
              <p className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400">
                No projects yet. Create one!
              </p>
            )}

            {projects.map((project) => (
              <button
                key={project}
                onClick={() => toggleSelect(project)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${
                  selectedProject === project
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-gray-900 dark:text-white"
                }`}
                aria-pressed={selectedProject === project}
              >
                {project}
              </button>
            ))}

            <div className="border-t border-gray-200 dark:border-neutral-700 mt-2 pt-2 px-3">
              {showNewProjectInput ? (
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateProject();
                      }
                      if (e.key === "Escape") {
                        setShowNewProjectInput(false);
                        setNewProjectName("");
                      }
                    }}
                    placeholder="Project name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-label="New project name"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8"
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowNewProjectInput(false);
                        setNewProjectName("");
                      }}
                      className="rounded-lg h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewProjectInput(true)}
                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
