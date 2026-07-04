import type { OnboardingCaseStatus } from "../constants/onboarding-case-status.js";
import type { OnboardingDocumentStatus } from "../constants/onboarding-document-status.js";
import type { OnboardingDocumentType } from "../constants/onboarding-document-type.js";
import type { OnboardingTaskOwner } from "../constants/onboarding-task-owner.js";
import type { OnboardingTaskPhase } from "../constants/onboarding-task-phase.js";
import type { OnboardingTaskStatus } from "../constants/onboarding-task-status.js";
import type { EmployeeDto } from "./employee.js";
import type { UserSummary } from "./requisition.js";

export type OnboardingCandidateSummary = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

export type OnboardingRequisitionSummary = {
  id: string;
  title: string;
  status: string;
};

export type OnboardingOfferSummary = {
  id: string;
  jobTitle: string;
  status: string;
  joiningDate: string;
};

export type OnboardingTimelineItemDto = {
  key: string;
  title: string;
  detail: string | null;
  at: string;
};

export type OnboardingTaskDto = {
  id: string;
  title: string;
  description: string | null;
  phase: OnboardingTaskPhase;
  ownerRole: OnboardingTaskOwner;
  isRequired: boolean;
  status: OnboardingTaskStatus;
  dueDate: string | null;
  sortOrder: number;
  completedAt: string | null;
  completedBy: UserSummary | null;
  skipReason: string | null;
  notes: string | null;
};

export type OnboardingDocumentDto = {
  id: string;
  documentType: OnboardingDocumentType;
  isRequired: boolean;
  status: OnboardingDocumentStatus;
  fileName: string | null;
  mimeType: string | null;
  uploadedAt: string | null;
  uploadedBy: UserSummary | null;
  verifiedAt: string | null;
  verifiedBy: UserSummary | null;
  waiveReason: string | null;
  notes: string | null;
};

export type OnboardingProgressDto = {
  tasksCompleted: number;
  tasksTotal: number;
  tasksRequiredCompleted: number;
  tasksRequiredTotal: number;
  documentsReady: number;
  documentsRequiredTotal: number;
};

export type OnboardingCaseDto = {
  id: string;
  status: OnboardingCaseStatus;
  candidate: OnboardingCandidateSummary;
  requisition: OnboardingRequisitionSummary;
  offer: OnboardingOfferSummary;
  employee: EmployeeDto | null;
  tasks: OnboardingTaskDto[];
  documents: OnboardingDocumentDto[];
  progress: OnboardingProgressDto;
  timeline: OnboardingTimelineItemDto[];
  startedAt: string | null;
  joinedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  startedBy: UserSummary | null;
  joinedBy: UserSummary | null;
  completedBy: UserSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type StartOnboardingRequest = {
  fullName?: string;
  email?: string;
  phone?: string;
  workEmail?: string;
  jobTitle?: string;
  departmentId?: string;
  expectedJoiningDate?: string;
  baseSalary?: number;
  currency?: string;
};

export type ConfirmJoiningRequest = {
  actualJoiningDate: string;
  notes?: string;
};

export type CancelOnboardingRequest = {
  reason: string;
};

export type UpdateOnboardingTaskRequest = {
  status?: OnboardingTaskStatus;
  notes?: string | null;
};

export type SkipOnboardingTaskRequest = {
  reason: string;
};

export type WaiveOnboardingDocumentRequest = {
  reason: string;
};

export type ListOnboardingQuery = {
  page: number;
  limit: number;
  status?: OnboardingCaseStatus;
  candidateId?: string;
  requisitionId?: string;
  search?: string;
};

export type PaginatedOnboardingCases = {
  items: OnboardingCaseDto[];
  meta: import("./user.js").PaginationMeta;
};
