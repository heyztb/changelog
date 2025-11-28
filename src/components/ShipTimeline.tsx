import { ShipCard } from "./ShipCard";
import type { Ship } from "@/lib/types";

interface ShipTimelineProps {
  ships: Ship[];
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
  showProject?: boolean;
  emptyMessage?: string;
}

export function ShipTimeline({
  ships,
  onLinkClick,
  showProject = true,
  emptyMessage = "No ships yet",
}: ShipTimelineProps) {
  if (ships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative before:absolute before:left-5 before:top-0 before:h-full before:w-px before:bg-gray-200 dark:before:bg-neutral-800 pb-12">
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
