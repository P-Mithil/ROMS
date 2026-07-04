import type { CandidateStatus } from "../constants/candidate-status.js";
import type { UserSummary } from "./requisition.js";

export type CandidateDto = {
  id: string;
  requisition: {
    id: string;
    title: string;
    status: string;
  };
  fullName: string;
  email: string;
  phone: string;
  totalExperienceYears: string | null;
  skills: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
  noticePeriodDays: number | null;
  resume: {
    fileName: string;
    mimeType: string;
    uploadedAt: string | null;
    uploadedBy: UserSummary | null;
  } | null;
  status: CandidateStatus;
  notes: string | null;
  rejectionReason: string | null;
  rejectionComments: string | null;
  rejectedAt: string | null;
  rejectedBy: UserSummary | null;
  recruiterNotes: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: UserSummary;
  }>;
  createdBy: UserSummary;
  updatedBy: UserSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCandidateRequest = {
  requisitionId: string;
  fullName: string;
  email: string;
  phone: string;
  totalExperienceYears?: number;
  skills?: string;
  currentCompany?: string;
  currentLocation?: string;
  noticePeriodDays?: number;
  notes?: string;
};

export type UpdateCandidateRequest = {
  fullName?: string;
  email?: string;
  phone?: string;
  totalExperienceYears?: number | null;
  skills?: string | null;
  currentCompany?: string | null;
  currentLocation?: string | null;
  noticePeriodDays?: number | null;
  notes?: string | null;
};

export type RejectCandidateRequest = {
  reason: string;
  comments?: string;
};

export type AddCandidateNoteRequest = {
  content: string;
};

