export type Attachment = {
  type: "link";
  url: string;
  title?: string;
};

export type Ship = {
  id: string;
  fid: number;
  displayName: string;
  avatarUrl?: string;
  project: string;
  text: string;
  link?: string;
  attachments: Attachment[];
  timestamp: string;
  createdAt: Date;
};

export type Project = {
  slug: string;
  name: string;
  shipCount: number;
  lastShipAt: Date;
  ships: Ship[];
  default: boolean;
};

export type EASProjectSchema = {
  name: string;
  description: string;
  website: string;
  creator: string;
  createdAt: Date;
};

export type User = {
  fid: number;
  displayName: string;
  avatarUrl?: string;
  streak: number;
  totalShips: number;
  projects: Project[];
  ships: Ship[];
};

export type GroupedShips = {
  [projectSlug: string]: Ship[];
};

// Helper to group ships by project
export function groupShipsByProject(ships: Ship[]): GroupedShips {
  return ships.reduce((acc, ship) => {
    const slug = ship.project.toLowerCase().replace(/\s+/g, "-");
    if (!acc[slug]) {
      acc[slug] = [];
    }
    acc[slug].push(ship);
    return acc;
  }, {} as GroupedShips);
}

// Helper to derive projects from ships
export function deriveProjects(ships: Ship[]): Project[] {
  const grouped = groupShipsByProject(ships);

  return Object.entries(grouped)
    .map(([slug, projectShips]) => {
      const firstShip = projectShips[0];
      if (!firstShip || projectShips.length === 0) {
        return null;
      }

      const sortedShips = [...projectShips].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const mostRecentShip = sortedShips[0];
      if (!mostRecentShip) {
        return null;
      }

      return {
        slug,
        name: firstShip.project,
        shipCount: projectShips.length,
        lastShipAt: mostRecentShip.createdAt,
        ships: sortedShips,
      };
    })
    .filter((project): project is Project => project !== null)
    .sort((a, b) => b.lastShipAt.getTime() - a.lastShipAt.getTime());
}

// Helper to calculate streak from ships
export function calculateStreak(ships: Ship[]): number {
  if (ships.length === 0) return 0;

  const sortedShips = [...ships].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const firstSortedShip = sortedShips[0];
  if (!firstSortedShip) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentShip = firstSortedShip.createdAt;
  const mostRecentDay = new Date(mostRecentShip);
  mostRecentDay.setHours(0, 0, 0, 0);

  // If most recent ship is older than yesterday, streak is broken
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (mostRecentDay < yesterday) {
    return 0;
  }

  // Count consecutive days
  let streak = 1;
  let currentDay = mostRecentDay;

  const shipDays = new Set(
    sortedShips.map((ship) => {
      const day = new Date(ship.createdAt);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    }),
  );

  while (true) {
    const prevDay = new Date(currentDay);
    prevDay.setDate(prevDay.getDate() - 1);

    if (shipDays.has(prevDay.getTime())) {
      streak++;
      currentDay = prevDay;
    } else {
      break;
    }
  }

  return streak;
}
