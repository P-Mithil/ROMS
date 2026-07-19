import {
  AI_MATCH_RECOMMENDATION_LABELS,
  type AiMatchRecommendation,
} from "@roms/shared";

export function recommendationFromScore(score: number): {
  code: AiMatchRecommendation;
  label: string;
} {
  let code: AiMatchRecommendation;
  if (score >= 80) {
    code = "STRONG_FIT";
  } else if (score >= 65) {
    code = "GOOD_FIT";
  } else if (score >= 45) {
    code = "PARTIAL_FIT";
  } else {
    code = "WEAK_FIT";
  }

  return { code, label: AI_MATCH_RECOMMENDATION_LABELS[code] };
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
