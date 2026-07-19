import type {
  AiCompareResult,
  AiDraftNoteResult,
  AiEmailDraftResult,
  AiEmailTemplate,
  AiFeedbackIntelligenceResult,
  AiInsightsResult,
  AiInterviewQuestionsResult,
  AiJdGenerateResult,
  AiMatchResult,
  AiMissingSkillsResult,
  AiNormalizeSkillsResult,
  AiNoteIntent,
  AiParseResumeResult,
  AiRequisitionImproveResult,
  AiResumeQualityResult,
  AiResumeSummaryResult,
  AiRiskAnalysisResult,
  AiSalarySuggestionResult,
  AiSkillGapResult,
  AiSuggestTagsResult,
  AiWeeklySummaryResult,
  GenerateJdInput,
  InsightsFiltersInput,
  InterviewRoundType,
} from "@roms/shared";
import { apiGet, apiPost, apiPostFormData } from "../../../lib/api-client.js";

export function parseResumeUpload(file: File) {
  const formData = new FormData();
  formData.append("resume", file);
  return apiPostFormData<AiParseResumeResult>("/ai/parse-resume", formData);
}

export function parseCandidateResume(candidateId: string) {
  return apiPost<AiParseResumeResult>(
    `/ai/candidates/${candidateId}/parse-resume`,
    {},
  );
}

export function summarizeCandidateResume(candidateId: string) {
  return apiPost<AiResumeSummaryResult>(
    `/ai/candidates/${candidateId}/summarize-resume`,
    {},
  );
}

export function normalizeSkills(skills: string) {
  return apiPost<AiNormalizeSkillsResult>("/ai/normalize-skills", { skills });
}

export function suggestCandidateTags(candidateId: string) {
  return apiPost<AiSuggestTagsResult>(
    `/ai/candidates/${candidateId}/suggest-tags`,
    {},
  );
}

export function scoreResumeQuality(candidateId: string) {
  return apiPost<AiResumeQualityResult>(
    `/ai/candidates/${candidateId}/resume-quality`,
    {},
  );
}

export function matchCandidate(candidateId: string) {
  return apiPost<AiMatchResult>(`/ai/candidates/${candidateId}/match`, {});
}

export function getSkillGap(candidateId: string) {
  return apiPost<AiSkillGapResult>(
    `/ai/candidates/${candidateId}/skill-gap`,
    {},
  );
}

export function compareCandidates(candidateIds: string[], requisitionId?: string) {
  return apiPost<AiCompareResult>("/ai/candidates/compare", {
    candidateIds,
    requisitionId,
  });
}

export function analyzeCandidateRisk(candidateId: string) {
  return apiPost<AiRiskAnalysisResult>(
    `/ai/candidates/${candidateId}/risk-analysis`,
    {},
  );
}

export function generateJd(body: GenerateJdInput) {
  return apiPost<AiJdGenerateResult>("/ai/requisitions/generate-jd", body);
}

export function generateJdForRequisition(requisitionId: string) {
  return apiPost<AiJdGenerateResult>(
    `/ai/requisitions/${requisitionId}/generate-jd`,
    {},
  );
}

export function improveRequisition(requisitionId: string) {
  return apiPost<AiRequisitionImproveResult>(
    `/ai/requisitions/${requisitionId}/improve`,
    {},
  );
}

export function generateInterviewQuestions(input: {
  candidateId: string;
  roundType: InterviewRoundType;
  customRoundLabel?: string;
}) {
  return apiPost<AiInterviewQuestionsResult>(
    "/ai/interviews/generate-questions",
    input,
  );
}

export function generateEmailDraft(input: {
  template: AiEmailTemplate;
  candidateId: string;
  interviewId?: string;
  offerId?: string;
  offerLink?: string;
  joiningDate?: string;
}) {
  return apiPost<AiEmailDraftResult>("/ai/emails/generate", input);
}

export function draftCandidateNote(
  candidateId: string,
  input: { intent?: AiNoteIntent; hint?: string },
) {
  return apiPost<AiDraftNoteResult>(
    `/ai/candidates/${candidateId}/draft-note`,
    input,
  );
}

export function suggestSalary(candidateId: string) {
  return apiPost<AiSalarySuggestionResult>(
    `/ai/candidates/${candidateId}/suggest-salary`,
    {},
  );
}

export function summarizeInterviewFeedback(interviewId: string) {
  return apiPost<AiFeedbackIntelligenceResult>(
    `/ai/interviews/${interviewId}/feedback-summary`,
    {},
  );
}

export function getHiringInsights(body: InsightsFiltersInput = {}) {
  return apiPost<AiInsightsResult>("/ai/insights/hiring", body);
}

export function getDepartmentInsights(body: InsightsFiltersInput = {}) {
  return apiPost<AiInsightsResult>("/ai/insights/departments", body);
}

export function getMissingSkills(query: InsightsFiltersInput = {}) {
  const params = new URLSearchParams();
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.requisitionId) params.set("requisitionId", query.requisitionId);
  const qs = params.toString();
  return apiGet<AiMissingSkillsResult>(
    `/ai/insights/missing-skills${qs ? `?${qs}` : ""}`,
  );
}

export function getWeeklyHiringSummary(body: InsightsFiltersInput = {}) {
  return apiPost<AiWeeklySummaryResult>("/ai/insights/weekly-summary", body);
}
