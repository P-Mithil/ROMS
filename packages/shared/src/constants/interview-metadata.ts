export const INTERVIEW_ROUND_TYPES = [
  "HR",
  "TECHNICAL",
  "MANAGERIAL",
  "FINAL",
  "CUSTOM",
] as const;

export type InterviewRoundType = (typeof INTERVIEW_ROUND_TYPES)[number];

export const INTERVIEW_MODES = [
  "IN_PERSON",
  "VIRTUAL",
  "PHONE",
] as const;

export type InterviewMode = (typeof INTERVIEW_MODES)[number];
