import type { Ship, User } from "./types";
import { deriveProjects, calculateStreak } from "./types";

// Base user data (ships will be attached dynamically)
const BASE_USERS: Omit<User, "projects" | "ships" | "streak" | "totalShips">[] =
  [
    {
      fid: 1,
      displayName: "alice.eth",
      avatarUrl: undefined,
    },
    {
      fid: 2,
      displayName: "bob.base",
      avatarUrl: undefined,
    },
    {
      fid: 3,
      displayName: "charlie",
      avatarUrl: undefined,
    },
  ];

export const MOCK_SHIPS: Ship[] = [
  {
    id: "1",
    fid: 1,
    displayName: "alice.eth",
    project: "Changelog",
    text: "Just shipped the new landing page! 🚀\n\nCheck it out live.",
    link: "https://example.com",
    attachments: [
      { type: "link", url: "https://example.com", title: "Live Demo" },
    ],
    timestamp: "2h ago",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    fid: 2,
    displayName: "bob.base",
    project: "NFT Marketplace",
    text: "Working on the smart contract integration. These docs are a lifesaver.",
    link: "https://docs.ethers.org",
    attachments: [
      {
        type: "link",
        url: "https://docs.ethers.org",
        title: "Ethers.js Documentation",
      },
    ],
    timestamp: "4h ago",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    fid: 3,
    displayName: "charlie",
    project: "Social Protocol",
    text: "Finally fixed that annoying bug in the authentication flow. Turns out it was a race condition.",
    attachments: [],
    timestamp: "6h ago",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "4",
    fid: 1,
    displayName: "alice.eth",
    project: "Changelog",
    text: "Added dark mode support. The CSS variables approach makes it so clean.",
    attachments: [],
    timestamp: "1d ago",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    fid: 1,
    displayName: "alice.eth",
    project: "DeFi Dashboard",
    text: "Integrated Uniswap v3 price feeds. Real-time updates are working smoothly now.",
    link: "https://docs.uniswap.org",
    attachments: [
      {
        type: "link",
        url: "https://docs.uniswap.org",
        title: "Uniswap Documentation",
      },
    ],
    timestamp: "2d ago",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: "6",
    fid: 3,
    displayName: "charlie",
    project: "Wallet Extension",
    text: "Shipped transaction simulation preview. Users can now see exactly what will happen before signing.",
    attachments: [],
    timestamp: "3d ago",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: "7",
    fid: 1,
    displayName: "alice.eth",
    project: "Changelog",
    text: "Built the project detail view - you can now see the full history of any project!",
    attachments: [],
    timestamp: "4d ago",
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
  },
  {
    id: "8",
    fid: 2,
    displayName: "bob.base",
    project: "NFT Marketplace",
    text: "Implemented lazy minting. Creators can now list NFTs without paying gas upfront.",
    link: "https://github.com/example/nft-marketplace",
    attachments: [
      {
        type: "link",
        url: "https://github.com/example/nft-marketplace",
        title: "GitHub Repository",
      },
    ],
    timestamp: "5d ago",
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
  },
  {
    id: "9",
    fid: 3,
    displayName: "charlie",
    project: "Social Protocol",
    text: "Added support for encrypted DMs using Lit Protocol. Privacy first! 🔐",
    link: "https://litprotocol.com",
    attachments: [
      {
        type: "link",
        url: "https://litprotocol.com",
        title: "Lit Protocol",
      },
    ],
    timestamp: "6d ago",
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000),
  },
  {
    id: "10",
    fid: 1,
    displayName: "alice.eth",
    project: "DeFi Dashboard",
    text: "Portfolio tracking is live. Connect your wallet and see all your positions in one place.",
    attachments: [],
    timestamp: "7d ago",
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
  },
];

// Helper functions to query mock data
export function getShipsByFid(fid: number): Ship[] {
  return MOCK_SHIPS.filter((ship) => ship.fid === fid).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function getShipsByProject(fid: number, projectSlug: string): Ship[] {
  return MOCK_SHIPS.filter((ship) => {
    const shipSlug = ship.project.toLowerCase().replace(/\s+/g, "-");
    return ship.fid === fid && shipSlug === projectSlug;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUserByFid(fid: number): User | undefined {
  const baseUser = BASE_USERS.find((user) => user.fid === fid);
  if (!baseUser) return undefined;

  const ships = getShipsByFid(fid);
  const projects = deriveProjects(ships);
  const streak = calculateStreak(ships);

  return {
    ...baseUser,
    ships,
    projects,
    streak,
    totalShips: ships.length,
  };
}

export function getAllShips(): Ship[] {
  return [...MOCK_SHIPS].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function getAllUsers(): User[] {
  return BASE_USERS.map((baseUser) => {
    const ships = getShipsByFid(baseUser.fid);
    const projects = deriveProjects(ships);
    const streak = calculateStreak(ships);

    return {
      ...baseUser,
      ships,
      projects,
      streak,
      totalShips: ships.length,
    };
  });
}
