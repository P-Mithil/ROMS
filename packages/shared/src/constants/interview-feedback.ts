export const INTERVIEW_RECOMMENDATIONS = [
  "STRONG_YES",
  "YES",
  "NEUTRAL",
  "NO",
  "STRONG_NO",
] as const;

export type InterviewRecommendation =
  (typeof INTERVIEW_RECOMMENDATIONS)[number];

export const INTERVIEW_RECOMMENDATION_LABELS: Record<
  InterviewRecommendation,
  string
> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  NEUTRAL: "Neutral",
  NO: "No",
  STRONG_NO: "Strong No",
};
