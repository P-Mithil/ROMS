import type {
  AiEmailTemplate,
  AiFieldConfidence,
  AiMatchRecommendation,
  AiNoteIntent,
} from "../constants/ai.js";

export type AiExtractedCandidateFields = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  totalExperienceYears: number | null;
  skills: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
  noticePeriodDays: number | null;
};

export type AiParseResumeResult = {
  extracted: AiExtractedCandidateFields;
  confidence: Partial<Record<keyof AiExtractedCandidateFields, AiFieldConfidence>>;
  rawTextPreview: string;
  disclaimer: string;
};

export type AiResumeSummaryResult = {
  summary: string;
  disclaimer: string;
};

export type AiNormalizeSkillsResult = {
  normalized: string[];
  rawToNormalized: Record<string, string>;
  unknown: string[];
  disclaimer: string;
};

export type AiSuggestTagsResult = {
  tags: string[];
  disclaimer: string;
};

export type AiResumeQualityResult = {
  score: number;
  reasons: string[];
  improvements: string[];
  disclaimer: string;
};

export type AiMatchBreakdown = {
  skills: number;
  experience: number;
  location: number;
  llmAdjustment: number;
};

export type AiMatchResult = {
  score: number;
  breakdown: AiMatchBreakdown;
  reasons: string[];
  summary: string;
  recommendation: {
    code: AiMatchRecommendation;
    label: string;
    rationale: string;
  };
  disclaimer: string;
};

export type AiSkillGapResult = {
  matched: string[];
  missing: string[];
  extra: string[];
  notes: string[];
  disclaimer: string;
};

export type AiCompareCandidateRow = {
  candidateId: string;
  fullName: string;
  score: number;
  recommendation: AiMatchRecommendation;
  topSkills: string[];
  experienceYears: number | null;
  missingSkills: string[];
};

export type AiCompareResult = {
  rows: AiCompareCandidateRow[];
  narrative: string;
  disclaimer: string;
};

export type AiRiskAnalysisResult = {
  risks: Array<{
    code: string;
    label: string;
    severity: "low" | "medium" | "high";
    detail: string;
  }>;
  disclaimer: string;
};

export type AiJdGenerateResult = {
  description: string;
  suggestedSkills: string;
  disclaimer: string;
};

export type AiRequisitionImproveResult = {
  suggestions: string[];
  revisedDescription: string | null;
  disclaimer: string;
};

export type AiInterviewQuestionsResult = {
  questions: string[];
  instructionsText: string;
  disclaimer: string;
};

export type AiEmailDraftResult = {
  subject: string;
  body: string;
  template: AiEmailTemplate;
  disclaimer: string;
};

export type AiDraftNoteResult = {
  content: string;
  intent: AiNoteIntent;
  disclaimer: string;
};

export type AiSalarySuggestionResult = {
  currency: string;
  suggestedMin: number | null;
  suggestedMax: number | null;
  midpoint: number | null;
  rationale: string[];
  disclaimer: string;
};

export type AiFeedbackIntelligenceResult = {
  summary: string;
  consensus: string;
  strengths: string[];
  concerns: string[];
  interviewerCount: number;
  disclaimer: string;
};

export type AiInsightsResult = {
  bullets: string[];
  metricsRef: Record<string, number | string | null>;
  disclaimer: string;
};

export type AiMissingSkillsResult = {
  skills: Array<{
    skill: string;
    count: number;
    requisitionTitles: string[];
  }>;
  commentary: string | null;
  disclaimer: string;
};

export type AiWeeklySummaryResult = {
  title: string;
  summary: string;
  bullets: string[];
  metricsRef: Record<string, number | string | null>;
  disclaimer: string;
};
