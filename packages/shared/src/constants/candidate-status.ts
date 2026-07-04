export const CANDIDATE_STATUSES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "SELECTED",
  "OFFER_ACCEPTED",
  "JOINED",
  "ONBOARDED",
  "WITHDRAWN",
  "OFFER_DECLINED",
  "REJECTED",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

