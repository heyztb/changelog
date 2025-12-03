/**
 * changelog/src/lib/constants.ts
 *
 * Centralized storage keys and related constants used across the Changelog app.
 *
 * Purpose:
 * - Consolidate all hardcoded localStorage keys to a single place to avoid
 *   typos and make refactors simpler.
 * - Export a strongly-typed `STORAGE_KEYS` object and a helper `StorageKey`
 *   type for better type-safety.
 */

export const STORAGE_KEYS = {
  USER_PROJECTS: "changelog-user-projects",
  USER_ONBOARDING: "changelog-user-onboarding-completed",
  SKIP_LINK_WARNING: "skip-link-warning",
  THEME: "changelog-theme",
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
