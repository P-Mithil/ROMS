export const AI_EMAIL_TEMPLATES = [
  "INTERVIEW_INVITE",
  "OFFER_EXTENDED",
  "REJECTION_POLITE",
  "ONBOARDING_WELCOME",
] as const;

export type AiEmailTemplate = (typeof AI_EMAIL_TEMPLATES)[number];

export const AI_NOTE_INTENTS = [
  "SCREENING",
  "POST_INTERVIEW",
  "GENERAL",
] as const;

export type AiNoteIntent = (typeof AI_NOTE_INTENTS)[number];

export const AI_FIELD_CONFIDENCE = ["high", "medium", "low"] as const;

export type AiFieldConfidence = (typeof AI_FIELD_CONFIDENCE)[number];

export const AI_MATCH_RECOMMENDATIONS = [
  "STRONG_FIT",
  "GOOD_FIT",
  "PARTIAL_FIT",
  "WEAK_FIT",
] as const;

export type AiMatchRecommendation = (typeof AI_MATCH_RECOMMENDATIONS)[number];

export const AI_MATCH_RECOMMENDATION_LABELS: Record<
  AiMatchRecommendation,
  string
> = {
  STRONG_FIT: "Strong fit",
  GOOD_FIT: "Good fit",
  PARTIAL_FIT: "Partial fit",
  WEAK_FIT: "Weak fit",
};
