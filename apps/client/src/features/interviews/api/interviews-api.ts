import type {
  CancelInterviewRequest,
  CompleteInterviewRequest,
  CreateInterviewFeedbackRequest,
  CreateInterviewRequest,
  InterviewDto,
  ListInterviewsQuery,
  NoShowInterviewRequest,
  PaginationMeta,
  UpdateFeedbackSummaryRequest,
  UpdateInterviewRequest,
} from "@roms/shared";
import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPatch,
  apiPost,
} from "../../../lib/api-client.js";

function buildQuery(query: ListInterviewsQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.candidateId) {
    params.set("candidateId", query.candidateId);
  }
  if (query.requisitionId) {
    params.set("requisitionId", query.requisitionId);
  }
  if (query.interviewerId) {
    params.set("interviewerId", query.interviewerId);
  }
  if (query.roundType) {
    params.set("roundType", query.roundType);
  }
  if (query.search) {
    params.set("search", query.search);
  }
  return params.toString();
}

export async function listInterviews(
  query: ListInterviewsQuery,
): Promise<{ items: InterviewDto[]; meta: PaginationMeta }> {
  const { data, meta } = await apiGetWithMeta<InterviewDto[]>(
    `/interviews?${buildQuery(query)}`,
  );
  return { items: data, meta };
}

export function getInterview(id: string) {
  return apiGet<InterviewDto>(`/interviews/${id}`);
}

export function createInterview(body: CreateInterviewRequest) {
  return apiPost<InterviewDto>("/interviews", body);
}

export function updateInterview(id: string, body: UpdateInterviewRequest) {
  return apiPatch<InterviewDto>(`/interviews/${id}`, body);
}

export function deleteInterview(id: string) {
  return apiDelete(`/interviews/${id}`);
}

export function cancelInterview(id: string, body: CancelInterviewRequest) {
  return apiPost<InterviewDto>(`/interviews/${id}/cancel`, body);
}

export function completeInterview(id: string, body: CompleteInterviewRequest) {
  return apiPost<InterviewDto>(`/interviews/${id}/complete`, body);
}

export function markInterviewNoShow(id: string, body: NoShowInterviewRequest) {
  return apiPost<InterviewDto>(`/interviews/${id}/mark-no-show`, body);
}

type SubmitInterviewFeedbackResponse = {
  interview: InterviewDto;
  feedbackId: string;
};

export function submitInterviewFeedback(
  id: string,
  body: CreateInterviewFeedbackRequest,
) {
  return apiPost<SubmitInterviewFeedbackResponse>(
    `/interviews/${id}/feedback`,
    body,
  );
}

export function updatePanelSummary(
  id: string,
  body: UpdateFeedbackSummaryRequest,
) {
  return apiPatch<InterviewDto>(`/interviews/${id}/feedback-summary`, body);
}
