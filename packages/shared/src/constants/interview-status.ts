export const INTERVIEW_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
