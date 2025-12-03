import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, ArrowUp, ChevronDown, Plus } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { LinkWarningModal } from "@/components/LinkWarningModal";
import { ShipTimeline } from "@/components/ShipTimeline";
import { getAllShips } from "@/lib/mock-data";
import { useUserProjects } from "@/hooks/useUserProjects";
import { WelcomeNewUserModal } from "@/components/WelcomeNewUserModal";
import { getTagline, hasUserOnboarded, ONBOARDING_STORAGE_KEY } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const tagline = useMemo(() => getTagline(), []);
  const [onboarded, setOnboarded] = useState(hasUserOnboarded());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { projects, addProject, isLoaded } = useUserProjects();
  const ships = getAllShips();

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    e.preventDefault();
    if (localStorage.getItem("skip-link-warning") === "true") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setPendingLink(url);
    setShowLinkWarning(true);
  };

  const handleConfirmLink = () => {
    if (pendingLink) {
      window.open(pendingLink, "_blank", "noopener,noreferrer");
      setShowLinkWarning(false);
      setPendingLink(null);
    }
  };

  const handleSubmit = () => {
    if (message.trim() && selectedProject) {
      setMessage("");
      setSelectedProject(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectProject = (project: string) => {
    if (selectedProject === project) {
      setSelectedProject(null);
    } else {
      setSelectedProject(project);
    }
    setShowProjectDropdown(false);
    setShowNewProjectInput(false);
    setNewProjectName("");
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const name = newProjectName.trim();
      addProject(name);
      setSelectedProject(name);
      setShowProjectDropdown(false);
      setShowNewProjectInput(false);
      setNewProjectName("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProjectDropdown(false);
        setShowNewProjectInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col items-center mt-12 min-h-[80vh]">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-4xl font-semibold text-center mb-12 text-gray-900 dark:text-white">
          {tagline}
        </h1>

        <div className="w-full rounded-3xl p-3 bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What did you make progress on today?"
            className="w-full bg-transparent border-none text-black dark:text-white placeholder:text-gray-400 resize-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 min-h-6 max-h-[200px]"
            rows={1}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 px-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <Paperclip className="w-4 h-4 mr-1" />
                Attach
              </Button>

              {/* Project selector */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className={`rounded-full h-9 px-3 hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                    selectedProject
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {selectedProject || "Select project"}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>

                {showProjectDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50 overflow-hidden">
                    <div className="py-2">
                      {isLoaded &&
                        projects.length === 0 &&
                        !showNewProjectInput && (
                          <p className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400">
                            No projects yet. Create one!
                          </p>
                        )}

                      {projects.map((project) => (
                        <button
                          key={project}
                          onClick={() => handleSelectProject(project)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${
                            selectedProject === project
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {project}
                        </button>
                      ))}

                      <div className="border-t border-gray-200 dark:border-neutral-700 mt-2 pt-2">
                        {showNewProjectInput ? (
                          <div className="px-3 py-2">
                            <input
                              type="text"
                              value={newProjectName}
                              onChange={(e) =>
                                setNewProjectName(e.target.value)
                              }
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
                              autoFocus
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
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || !selectedProject}
              className="bg-black text-white dark:bg-white dark:text-black rounded-full h-9 w-9 p-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <ShipTimeline
            ships={ships}
            onLinkClick={handleLinkClick}
            separated={true}
          />
        </div>
      </div>

      <LinkWarningModal
        isOpen={showLinkWarning}
        onClose={() => setShowLinkWarning(false)}
        onConfirm={handleConfirmLink}
      />
      <WelcomeNewUserModal
        isOpen={!onboarded}
        onClose={() => {
          localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
          setOnboarded(true);
        }}
      />
    </div>
  );
}
