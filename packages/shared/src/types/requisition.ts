import type { DepartmentSummary } from "./auth.js";
import type { RequisitionStatus } from "../constants/requisition-status.js";
import type {
  EmploymentType,
  HiringPriority,
  WorkMode,
} from "../constants/requisition-metadata.js";

export type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type JobRequisitionDto = {
  id: string;
  title: string;
  description: string | null;
  skills: string | null;
  status: RequisitionStatus;
  hiringPriority: HiringPriority;
  openings: number;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceMin: string | null;
  experienceMax: string | null;
  candidateCount: number;
  shortlistedCount: number;
  filledPositions: number;
  department: DepartmentSummary;
  hiringManager: UserSummary;
  createdBy: UserSummary;
  approvedBy: UserSummary | null;
  approvedAt: string | null;
  submittedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  closedBy: UserSummary | null;
  closedAt: string | null;
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequisitionListSummary = {
  total: number;
  open: number;
  pendingApproval: number;
  closed: number;
  totalOpenings: number;
  totalCandidates: number;
  totalShortlisted: number;
};

export type CreateRequisitionRequest = {
  title: string;
  description?: string;
  skills?: string;
  departmentId: string;
  hiringManagerId: string;
  hiringPriority: HiringPriority;
  openings: number;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
};

export type UpdateRequisitionRequest = {
  title?: string;
  description?: string | null;
  skills?: string | null;
  departmentId?: string;
  hiringManagerId?: string;
  hiringPriority?: HiringPriority;
  openings?: number;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  salaryMin?: number | null;
  salaryMax?: number | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
};

export type RejectRequisitionRequest = {
  reason: string;
};

export type CloseRequisitionRequest = {
  reason: string;
};
