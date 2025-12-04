import { createFileRoute } from "@tanstack/react-router";
import { getAllShips } from "@/lib/mock-data";
import { useUserProjects } from "@/hooks/useUserProjects";
import { WelcomeNewUserModal } from "@/components/WelcomeNewUserModal";
import { useTagline } from "@/hooks/useTagline";
import { useLinkWarning } from "@/hooks/useLinkWarning";
import { LinkWarningModal } from "@/components/LinkWarningModal";
import { ShipTimeline } from "@/components/ShipTimeline";
import { Composer } from "@/components/Composer";
import { useOnboarding } from "@/hooks/useOnboarding";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const { tagline } = useTagline();
  const { showLinkWarning, handleLinkClick, handleConfirmLink, handleCancel } =
    useLinkWarning();
  const { isOnboarded, completeOnboarding } = useOnboarding();

  const { projects, addProject, isLoaded } = useUserProjects();
  const ships = getAllShips();

  return (
    <div className="flex flex-col items-center mt-12 min-h-[80vh]">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-4xl font-semibold text-center mb-12 text-gray-900 dark:text-white">
          {tagline}
        </h1>

        <Composer
          projects={projects}
          addProject={addProject}
          isLoaded={isLoaded}
          onLinkClick={handleLinkClick}
        />

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
