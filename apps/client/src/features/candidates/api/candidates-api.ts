import type {
  AddCandidateNoteRequest,
  CandidateDto,
  CreateCandidateRequest,
  ListCandidatesQuery,
  PaginationMeta,
  RejectCandidateRequest,
  UpdateCandidateRequest,
} from "@roms/shared";
import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPatch,
  apiPost,
  apiPostFormData,
  downloadAuthenticatedFile,
} from "../../../lib/api-client.js";

function buildQuery(query: ListCandidatesQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.requisitionId) {
    params.set("requisitionId", query.requisitionId);
  }
  if (query.search) {
    params.set("search", query.search);
  }
  return params.toString();
}

export async function listCandidates(
  query: ListCandidatesQuery,
): Promise<{ items: CandidateDto[]; meta: PaginationMeta }> {
  const { data, meta } = await apiGetWithMeta<CandidateDto[]>(
    `/candidates?${buildQuery(query)}`,
  );
  return { items: data, meta };
}

export function getCandidate(id: string) {
  return apiGet<CandidateDto>(`/candidates/${id}`);
}

export function createCandidate(body: CreateCandidateRequest) {
  return apiPost<CandidateDto>("/candidates", body);
}

export function updateCandidate(id: string, body: UpdateCandidateRequest) {
  return apiPatch<CandidateDto>(`/candidates/${id}`, body);
}

export function deleteCandidate(id: string) {
  return apiDelete(`/candidates/${id}`);
}

export function moveCandidateToScreening(id: string) {
  return apiPost<CandidateDto>(`/candidates/${id}/move-to-screening`, {});
}

export function shortlistCandidate(id: string) {
  return apiPost<CandidateDto>(`/candidates/${id}/shortlist`, {});
}

export function rejectCandidate(id: string, body: RejectCandidateRequest) {
  return apiPost<CandidateDto>(`/candidates/${id}/reject`, body);
}

export function uploadCandidateResume(id: string, file: File) {
  const formData = new FormData();
  formData.append("resume", file);
  return apiPostFormData<CandidateDto>(`/candidates/${id}/resume`, formData);
}

export function downloadCandidateResume(id: string, fileName: string) {
  return downloadAuthenticatedFile(`/candidates/${id}/resume`, fileName);
}

export function deleteCandidateResume(id: string) {
  return apiDelete(`/candidates/${id}/resume`);
}

export function addCandidateNote(id: string, body: AddCandidateNoteRequest) {
  return apiPost<CandidateDto>(`/candidates/${id}/notes`, body);
}
