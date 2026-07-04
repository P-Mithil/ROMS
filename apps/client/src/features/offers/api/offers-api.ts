import type {
  CreateOfferRequest,
  ExtendOfferResponse,
  ListOffersQuery,
  OfferDto,
  PaginationMeta,
  PublicDeclineOfferRequest,
  RecordOfferAcceptanceRequest,
  RecordOfferDeclineRequest,
  RejectOfferApprovalRequest,
  UpdateOfferRequest,
  WithdrawOfferRequest,
} from "@roms/shared";
import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPatch,
  apiPost,
} from "../../../lib/api-client.js";

function buildQuery(query: ListOffersQuery) {
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

export async function listOffers(
  query: ListOffersQuery,
): Promise<{ items: OfferDto[]; meta: PaginationMeta }> {
  const { data, meta } = await apiGetWithMeta<OfferDto[]>(
    `/offers?${buildQuery(query)}`,
  );
  return { items: data, meta };
}

export function getOffer(id: string) {
  return apiGet<OfferDto>(`/offers/${id}`);
}

export function createOffer(body: CreateOfferRequest) {
  return apiPost<OfferDto>("/offers", body);
}

export function updateOffer(id: string, body: UpdateOfferRequest) {
  return apiPatch<OfferDto>(`/offers/${id}`, body);
}

export function deleteOffer(id: string) {
  return apiDelete(`/offers/${id}`);
}

export function submitOffer(id: string) {
  return apiPost<OfferDto>(`/offers/${id}/submit`, {});
}

export function approveOffer(id: string) {
  return apiPost<OfferDto>(`/offers/${id}/approve`, {});
}

export function rejectOfferApproval(id: string, body: RejectOfferApprovalRequest) {
  return apiPost<OfferDto>(`/offers/${id}/reject-approval`, body);
}

export function extendOffer(id: string) {
  return apiPost<ExtendOfferResponse>(`/offers/${id}/extend`, {});
}

export function withdrawOffer(id: string, body: WithdrawOfferRequest) {
  return apiPost<OfferDto>(`/offers/${id}/withdraw`, body);
}

export function recordOfferAcceptance(
  id: string,
  body: RecordOfferAcceptanceRequest,
) {
  return apiPost<OfferDto>(`/offers/${id}/record-acceptance`, body);
}

export function recordOfferDecline(id: string, body: RecordOfferDeclineRequest) {
  return apiPost<OfferDto>(`/offers/${id}/record-decline`, body);
}
