import { ShipCard } from "./ShipCard";
import type { Ship } from "@/lib/types";

interface ShipTimelineProps {
  ships: Ship[];
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
  showProject?: boolean;
  emptyMessage?: string;
  separated?: boolean;
}

export function ShipTimeline({
  ships,
  onLinkClick,
  showProject = true,
  emptyMessage = "No ships yet",
  separated = false,
}: ShipTimelineProps) {
  if (ships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (separated) {
    return (
      <div className="pb-12">
        {ships.map((ship, index) => (
          <div key={ship.id}>
            <ShipCard
              ship={ship}
              onLinkClick={onLinkClick}
              showProject={showProject}
            />
            {index < ships.length - 1 && (
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-50 dark:bg-neutral-950 px-3 text-xs text-gray-400 dark:text-neutral-600">
                    •
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative pb-12">
      <div
        className="absolute left-5 top-0 w-px bg-gray-200 dark:bg-neutral-800"
        style={{
          height: `calc(100% - ${ships[ships.length - 1] ? "60px" : "0px"})`,
        }}
      />
      {ships.map((ship) => (
        <ShipCard
          key={ship.id}
          ship={ship}
          onLinkClick={onLinkClick}
          showProject={showProject}
        />
      ))}
    </div>
  );
}
