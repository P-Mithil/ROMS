import type {
  CloseRequisitionRequest,
  CreateRequisitionRequest,
  JobRequisitionDto,
  ListRequisitionsQuery,
  PaginationMeta,
  RequisitionListSummary,
  RejectRequisitionRequest,
  UpdateRequisitionRequest,
} from "@roms/shared";
import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPatch,
  apiPost,
} from "../../../lib/api-client.js";

function buildQuery(query: ListRequisitionsQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.hiringPriority) {
    params.set("hiringPriority", query.hiringPriority);
  }
  if (query.departmentId) {
    params.set("departmentId", query.departmentId);
  }
  if (query.workMode) {
    params.set("workMode", query.workMode);
  }
  if (query.search) {
    params.set("search", query.search);
  }
  return params.toString();
}

export async function listRequisitions(
  query: ListRequisitionsQuery,
): Promise<{
  items: JobRequisitionDto[];
  meta: PaginationMeta;
  summary: RequisitionListSummary;
}> {
  const { data, meta, summary } = await apiGetWithMeta<
    JobRequisitionDto[],
    { summary: RequisitionListSummary }
  >(
    `/requisitions?${buildQuery(query)}`,
  );
  return { items: data, meta, summary };
}

export function getRequisition(id: string) {
  return apiGet<JobRequisitionDto>(`/requisitions/${id}`);
}

export function createRequisition(body: CreateRequisitionRequest) {
  return apiPost<JobRequisitionDto>("/requisitions", body);
}

export function updateRequisition(id: string, body: UpdateRequisitionRequest) {
  return apiPatch<JobRequisitionDto>(`/requisitions/${id}`, body);
}

export function deleteRequisition(id: string) {
  return apiDelete(`/requisitions/${id}`);
}

export function submitRequisition(id: string) {
  return apiPost<JobRequisitionDto>(`/requisitions/${id}/submit`, {});
}

export function approveRequisition(id: string) {
  return apiPost<JobRequisitionDto>(`/requisitions/${id}/approve`, {});
}

export function rejectRequisition(id: string, body: RejectRequisitionRequest) {
  return apiPost<JobRequisitionDto>(`/requisitions/${id}/reject`, body);
}

export function closeRequisition(id: string, body: CloseRequisitionRequest) {
  return apiPost<JobRequisitionDto>(`/requisitions/${id}/close`, body);
}
