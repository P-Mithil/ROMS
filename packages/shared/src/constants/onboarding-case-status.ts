export const ONBOARDING_CASE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "JOINED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OnboardingCaseStatus = (typeof ONBOARDING_CASE_STATUSES)[number];
