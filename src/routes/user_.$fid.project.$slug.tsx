import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Package } from "lucide-react";
import { getUserByFid, getShipsByProject } from "@/lib/mock-data";
import { ShipTimeline } from "@/components/ShipTimeline";
import { LinkWarningModal } from "@/components/LinkWarningModal";
import { useState } from "react";

export const Route = createFileRoute("/user_/$fid/project/$slug")({
  component: ProjectChangelogComponent,
});

function ProjectChangelogComponent() {
  const { fid, slug } = Route.useParams();
  const user = getUserByFid(parseInt(fid, 10));
  const ships = getShipsByProject(parseInt(fid, 10), slug);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

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

  // Find the project from user's projects
  const project = user?.projects.find((p) => p.slug === slug);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          User not found
        </h1>
        <Link
          to="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back home
        </Link>
      </div>
    );
  }

  if (!project || ships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Project not found
        </h1>
        <Link
          to="/user/$fid"
          params={{ fid }}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to {user.displayName}'s profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-8 min-h-[80vh]">
      <div className="w-full max-w-3xl px-4">
        {/* Back button */}
        <Link
          to="/user/$fid"
          params={{ fid }}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {user.displayName}'s profile
        </Link>

        {/* Project header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="w-16 h-16 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {project.name}
            </h1>
            <Link
              to="/user/$fid"
              params={{ fid }}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3 inline-block"
            >
              by {user.displayName}
            </Link>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>{project.shipCount} ships</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>
                  Started{" "}
                  {(() => {
                    const oldestShip = ships[ships.length - 1];
                    return oldestShip
                      ? getTimeAgo(oldestShip.createdAt)
                      : "recently";
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Changelog header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Changelog
          </h2>
          <span className="text-sm text-gray-500 dark:text-neutral-400">
            {ships.length} updates
          </span>
        </div>

        {/* Ship timeline */}
        <ShipTimeline
          ships={ships}
          onLinkClick={handleLinkClick}
          showProject={false}
        />
      </div>

      <LinkWarningModal
        isOpen={showLinkWarning}
        onClose={() => setShowLinkWarning(false)}
        onConfirm={handleConfirmLink}
      />
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
