import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Folder, Package } from "lucide-react";
import { getUserByFid } from "@/lib/mock-data";
import { ShipTimeline } from "@/components/ShipTimeline";
import { LinkWarningModal } from "@/components/LinkWarningModal";
import { useLinkWarning } from "@/hooks/useLinkWarning";
import { getTimeAgo } from "@/lib/utils";

export const Route = createFileRoute("/user/$fid")({
  component: UserProfileComponent,
});

function UserProfileComponent() {
  const { fid } = Route.useParams();
  const user = getUserByFid(parseInt(fid, 10));
  const { showLinkWarning, handleLinkClick, handleConfirmLink, handleCancel } =
    useLinkWarning();

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

  return (
    <div className="flex flex-col items-center mt-8 min-h-[80vh]">
      <div className="w-full max-w-3xl px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>

        {/* User header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-500 shrink-0" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {user.displayName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{user.streak} day streak</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>{user.totalShips} ships</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Projects
          </h2>
          <div className="grid gap-3">
            {user.projects.map((project) => {
              const timeAgo = getTimeAgo(project.lastShipAt);
              return (
                <Link
                  key={project.slug}
                  to="/user/$fid/project/$slug"
                  params={{ fid: fid, slug: project.slug }}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">
                        {project.shipCount} ships • last updated {timeAgo}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Ships
          </h2>
          <ShipTimeline
            ships={user.ships}
            onLinkClick={handleLinkClick}
            showProject={true}
            separated={true}
          />
        </div>
      </div>

      <LinkWarningModal
        isOpen={showLinkWarning}
        onClose={handleCancel}
        onConfirm={handleConfirmLink}
      />
    </div>
  );
}
