import type { OfferStatus } from "../constants/offer-status.js";
import type { EmploymentType, WorkMode } from "../constants/requisition-metadata.js";
import type { PaginationMeta } from "./user.js";
import type { UserSummary } from "./requisition.js";

export type OfferCandidateSummary = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

export type OfferRequisitionSummary = {
  id: string;
  title: string;
  status: string;
};

export type OfferTimelineItemDto = {
  key: string;
  title: string;
  detail: string | null;
  at: string;
};

export type OfferDto = {
  id: string;
  candidate: OfferCandidateSummary;
  requisition: OfferRequisitionSummary;
  status: OfferStatus;
  jobTitle: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  baseSalary: number;
  currency: string;
  joiningDate: string;
  validUntil: string;
  terms: string | null;
  internalNotes: string | null;
  approvalRejectionReason: string | null;
  declineReason: string | null;
  responseNotes: string | null;
  timeline: OfferTimelineItemDto[];
  createdBy: UserSummary;
  updatedBy: UserSummary | null;
  approvedBy: UserSummary | null;
  extendedBy: UserSummary | null;
  submittedAt: string | null;
  approvedAt: string | null;
  extendedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicOfferDto = {
  id: string;
  candidateName: string;
  jobTitle: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  baseSalary: number;
  currency: string;
  joiningDate: string;
  validUntil: string;
  terms: string | null;
  status: OfferStatus;
  requisitionTitle: string;
};

export type CreateOfferRequest = {
  candidateId: string;
  jobTitle?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  baseSalary: number;
  currency?: string;
  joiningDate: string;
  validUntil: string;
  terms?: string;
  internalNotes?: string;
};

export type UpdateOfferRequest = {
  jobTitle?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  baseSalary?: number;
  currency?: string;
  joiningDate?: string;
  validUntil?: string;
  terms?: string | null;
  internalNotes?: string | null;
};

export type RejectOfferApprovalRequest = {
  reason: string;
};

export type WithdrawOfferRequest = {
  reason: string;
};

export type RecordOfferAcceptanceRequest = {
  notes?: string;
};

export type RecordOfferDeclineRequest = {
  reason: string;
  notes?: string;
};

export type PublicDeclineOfferRequest = {
  reason: string;
};

export type ListOffersQuery = {
  page: number;
  limit: number;
  status?: OfferStatus;
  candidateId?: string;
  requisitionId?: string;
  search?: string;
};

export type PaginatedOffers = {
  items: OfferDto[];
  meta: PaginationMeta;
};

export type ExtendOfferResponse = {
  offer: OfferDto;
  responseToken: string;
};
