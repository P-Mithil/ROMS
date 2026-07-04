export const ROLE_NAMES = [
  "HR_ADMIN",
  "RECRUITER",
  "HIRING_MANAGER",
  "INTERVIEWER",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
