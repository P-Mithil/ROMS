export const ONBOARDING_DOCUMENT_STATUSES = [
  "PENDING",
  "RECEIVED",
  "VERIFIED",
  "WAIVED",
] as const;

export type OnboardingDocumentStatus =
  (typeof ONBOARDING_DOCUMENT_STATUSES)[number];
