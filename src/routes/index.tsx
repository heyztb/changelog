import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, ArrowUp } from "lucide-react";
import { useState } from "react";
import { LinkWarningModal } from "@/components/LinkWarningModal";
import { ShipTimeline } from "@/components/ShipTimeline";
import { getAllShips } from "@/lib/mock-data";
import { useUserProjects } from "@/hooks/useUserProjects";
import { WelcomeNewUserModal } from "@/components/WelcomeNewUserModal";
import useTagline from "@/hooks/useTagline";
import { useLinkWarning } from "@/hooks/useLinkWarning";
import { useOnboarding } from "@/hooks/useOnboarding";
import ProjectSelector from "@/components/ProjectSelector";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { showLinkWarning, handleLinkClick, handleConfirmLink, handleCancel } =
    useLinkWarning();
  const { tagline } = useTagline();
  const { isOnboarded, completeOnboarding } = useOnboarding();

  const { projects, addProject, isLoaded } = useUserProjects();
  const ships = getAllShips();

  // Link handling is now delegated to `useLinkWarning` hook.
  // The hook provides `handleLinkClick` and `handleConfirmLink` which are used
  // by the timeline and the LinkWarningModal respectively.

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
              <ProjectSelector
                selectedProject={selectedProject}
                onSelectProject={(p) => setSelectedProject(p)}
                projects={projects}
                addProject={addProject}
                isLoaded={isLoaded}
              />
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
        onClose={handleCancel}
        onConfirm={handleConfirmLink}
      />
      <WelcomeNewUserModal isOpen={!isOnboarded} onClose={completeOnboarding} />
    </div>
  );
}
