export const STORAGE_KEYS = {
  USER_PROJECTS: "changelog-user-projects",
  USER_ONBOARDING: "changelog-user-onboarding-completed",
  SKIP_LINK_WARNING: "skip-link-warning",
  THEME: "changelog-theme",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const EAS_BASE_ADDRESS = "0x4200000000000000000000000000000000000021";
export const EAS_BASE_SCHEMA_REGISTRY_ADDRESS =
  "0x4200000000000000000000000000000000000020";
export const EAS_PROJECT_SCHEMA =
  "string name,string description,string website,address creator,uint256 createdAt";
