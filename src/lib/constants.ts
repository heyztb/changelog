export const STORAGE_KEYS = {
  USER_PROJECTS: "changelog-user-projects",
  USER_ONBOARDING: "changelog-user-onboarding-completed",
  SKIP_LINK_WARNING: "skip-link-warning",
  THEME: "changelog-theme",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
