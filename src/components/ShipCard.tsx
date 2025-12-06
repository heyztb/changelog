import React from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Folder } from "lucide-react";
import type { Ship } from "@/lib/types";

interface ShipCardProps {
  ship: Ship;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
  showProject?: boolean;
}

function ShipCardComponent({
  ship,
  onLinkClick,
  showProject = true,
}: ShipCardProps) {
  const projectSlug = ship.project.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="relative pl-16 pb-12 last:pb-0">
      <Link
        to="/user/$fid"
        params={{ fid: ship.fid.toString() }}
        aria-label={`View ${ship.displayName}'s profile`}
        className="absolute left-0 top-0 w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 shrink-0 ring-4 ring-white dark:ring-neutral-950 z-10 hover:ring-blue-200 dark:hover:ring-blue-900 transition-all cursor-pointer"
      />

      <div className="pt-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              to="/user/$fid"
              params={{ fid: ship.fid.toString() }}
              aria-label={`View ${ship.displayName}'s profile`}
              className="font-semibold text-gray-900 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {ship.displayName}
            </Link>
            {showProject && (
              <>
                <span className="text-gray-400 dark:text-neutral-500">·</span>
                <Link
                  to="/user/$fid/project/$slug"
                  params={{ fid: ship.fid.toString(), slug: projectSlug }}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Folder className="w-3 h-3" />
                  {ship.project}
                </Link>
              </>
            )}
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-neutral-500">
            {ship.timestamp}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[15px] mb-4">
          {ship.text}
        </p>

        {ship.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ship.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => onLinkClick?.(e, att.url)}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 hover:border-gray-300 dark:hover:border-neutral-700 transition-all w-full sm:w-auto shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {att.title || "External Link"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-neutral-500 truncate max-w-[200px]">
                    {att.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ShipCard = React.memo(ShipCardComponent);
ShipCard.displayName = "ShipCard";

export { ShipCard };
