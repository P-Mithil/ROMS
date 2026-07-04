export const HIRING_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type HiringPriority = (typeof HIRING_PRIORITIES)[number];

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "INTERNSHIP",
  "CONTRACT",
  "PART_TIME",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["OFFICE", "HYBRID", "REMOTE"] as const;

export type WorkMode = (typeof WORK_MODES)[number];
