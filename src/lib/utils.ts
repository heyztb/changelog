import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORAGE_KEYS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ONBOARDING_STORAGE_KEY = STORAGE_KEYS.USER_ONBOARDING;

export const hasUserOnboarded = () => {
  try {
    const storedValue = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return storedValue === "true";
  } catch {
    return false;
  }
};

export const getTagline = () => {
  if (!hasUserOnboarded()) {
    return "Welcome to Changelog! 🚀";
  }

  const hour = new Date().getHours();

  const morningTaglines = [
    "Good morning, builder ☀️",
    "Rise and ship 🌅",
    "Morning momentum starts here",
    "Early bird gets the deploy",
    "Fresh start, fresh commits",
  ];

  const afternoonTaglines = [
    "Keep shipping 🚀",
    "Afternoon progress report",
    "What did you build today?",
    "Show us what you made",
    "Momentum doesn't stop",
  ];

  const eveningTaglines = [
    "Evening check-in 🌙",
    "Ship before sunset 🌆",
    "End the day with a win",
    "What did you accomplish?",
    "Close the loop on today",
  ];

  const lateNightTaglines = [
    "Burning the midnight oil? 🔥",
    "Night owl shipping hours 🦉",
    "Late night builds hit different",
    "The best code ships at night",
    "Nocturnal builder mode",
  ];

  const generalTaglines = [
    "Build in public",
    "Ship daily, grow exponentially",
    "Your daily shipping log",
    "Consistency beats intensity",
    "Document the journey",
    "Show your work",
    "Progress over perfection",
    "One ship at a time",
    "Build, ship, repeat",
    "Make it count",
  ];

  let taglines: string[];

  if (hour >= 5 && hour < 12) {
    taglines = morningTaglines;
  } else if (hour >= 12 && hour < 17) {
    taglines = afternoonTaglines;
  } else if (hour >= 17 && hour < 22) {
    taglines = eveningTaglines;
  } else {
    taglines = lateNightTaglines;
  }

  // 30% chance to show a general tagline instead of time-based
  if (Math.random() < 0.3) {
    taglines = generalTaglines;
  }

  return taglines[Math.floor(Math.random() * taglines.length)];
};

export function getTimeAgo(date: Date): string {
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
