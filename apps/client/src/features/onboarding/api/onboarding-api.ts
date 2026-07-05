import type {
  CancelOnboardingRequest,
  ConfirmJoiningRequest,
  ListOnboardingQuery,
  OnboardingCaseDto,
  PaginationMeta,
  SkipOnboardingTaskRequest,
  StartOnboardingRequest,
  WaiveOnboardingDocumentRequest,
} from "@roms/shared";
import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPost,
  apiPostFormData,
  downloadAuthenticatedFile,
} from "../../../lib/api-client.js";

function buildQuery(query: ListOnboardingQuery) {
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
  if (query.search) {
    params.set("search", query.search);
  }
  return params.toString();
}

export async function listOnboardingCases(
  query: ListOnboardingQuery,
): Promise<{ items: OnboardingCaseDto[]; meta: PaginationMeta }> {
  const { data, meta } = await apiGetWithMeta<OnboardingCaseDto[]>(
    `/onboarding?${buildQuery(query)}`,
  );
  return { items: data, meta };
}

export function getOnboardingCase(id: string) {
  return apiGet<OnboardingCaseDto>(`/onboarding/${id}`);
}

export function startOnboarding(id: string, body: StartOnboardingRequest) {
  return apiPost<OnboardingCaseDto>(`/onboarding/${id}/start`, body);
}

export function confirmJoining(id: string, body: ConfirmJoiningRequest) {
  return apiPost<OnboardingCaseDto>(`/onboarding/${id}/confirm-joining`, body);
}

export function completeOnboarding(id: string) {
  return apiPost<OnboardingCaseDto>(`/onboarding/${id}/complete`, {});
}

export function cancelOnboarding(id: string, body: CancelOnboardingRequest) {
  return apiPost<OnboardingCaseDto>(`/onboarding/${id}/cancel`, body);
}

export function completeOnboardingTask(caseId: string, taskId: string) {
  return apiPost<OnboardingCaseDto>(
    `/onboarding/${caseId}/tasks/${taskId}/complete`,
    {},
  );
}

export function skipOnboardingTask(
  caseId: string,
  taskId: string,
  body: SkipOnboardingTaskRequest,
) {
  return apiPost<OnboardingCaseDto>(
    `/onboarding/${caseId}/tasks/${taskId}/skip`,
    body,
  );
}

export function uploadOnboardingDocument(
  caseId: string,
  docId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("document", file);
  return apiPostFormData<OnboardingCaseDto>(
    `/onboarding/${caseId}/documents/${docId}/upload`,
    formData,
  );
}

export function downloadOnboardingDocument(
  caseId: string,
  docId: string,
  fileName: string,
) {
  return downloadAuthenticatedFile(
    `/onboarding/${caseId}/documents/${docId}/download`,
    fileName,
  );
}

export function deleteOnboardingDocumentFile(caseId: string, docId: string) {
  return apiDelete(`/onboarding/${caseId}/documents/${docId}/file`).then(
    () => getOnboardingCase(caseId),
  );
}

export async function verifyOnboardingDocument(caseId: string, docId: string) {
  return apiPost<OnboardingCaseDto>(
    `/onboarding/${caseId}/documents/${docId}/verify`,
    {},
  );
}

export function waiveOnboardingDocument(
  caseId: string,
  docId: string,
  body: WaiveOnboardingDocumentRequest,
) {
  return apiPost<OnboardingCaseDto>(
    `/onboarding/${caseId}/documents/${docId}/waive`,
    body,
  );
}
