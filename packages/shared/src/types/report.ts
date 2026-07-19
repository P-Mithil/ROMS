import type { CandidateStatus } from "../constants/candidate-status.js";
import type { EmployeeStatus } from "../constants/employee-status.js";
import type { InterviewMode, InterviewRoundType } from "../constants/interview-metadata.js";
import type { InterviewRecommendation } from "../constants/interview-feedback.js";
import type { InterviewStatus } from "../constants/interview-status.js";
import type { OfferStatus } from "../constants/offer-status.js";
import type { OnboardingCaseStatus } from "../constants/onboarding-case-status.js";
import type {
  EmploymentType,
  HiringPriority,
  WorkMode,
} from "../constants/requisition-metadata.js";
import type { RequisitionStatus } from "../constants/requisition-status.js";
import type {
  ReportExportFormat,
  ReportInterviewDateBasis,
  ReportOfferDateBasis,
  ReportOnboardingDateBasis,
} from "../constants/report.js";

export type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
  requisitionId?: string;
  search?: string;
  interviewDateBasis?: ReportInterviewDateBasis;
  offerDateBasis?: ReportOfferDateBasis;
  onboardingDateBasis?: ReportOnboardingDateBasis;
};

export type StatusCountDto = {
  status: string;
  count: number;
};

export type NamedCountDto = {
  key: string;
  label: string;
  count: number;
};

export type ConversionRatioDto = {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
  rate: number | null;
};

export type CurrencyAverageDto = {
  currency: string;
  average: number;
  count: number;
};

export type ReportOverviewDto = {
  filters: ReportFilters;
  kpis: {
    openRequisitions: number;
    activeCandidates: number;
    interviewsScheduled: number;
    offersPendingResponse: number;
    onboardingInProgress: number;
    employeesJoinedInPeriod: number;
    offerAcceptRate: number | null;
    avgTimeToHireDays: number | null;
  };
  recentActivity: {
    interviewsCompleted: number;
    offersExtended: number;
    onboardingsCompleted: number;
  };
  funnelSnapshot: NamedCountDto[];
  topDepartments: Array<{
    departmentId: string;
    departmentName: string;
    openRequisitions: number;
    joined: number;
  }>;
};

export type ReportRecruitmentDto = {
  filters: ReportFilters;
  requisitionsByStatus: Array<{ status: RequisitionStatus; count: number }>;
  openingsVsFilled: {
    totalOpenings: number;
    totalFilled: number;
  };
  candidatesCreatedInRange: number;
  candidatesByStatus: Array<{ status: CandidateStatus; count: number }>;
  rejectionRate: number | null;
  withdrawalRate: number | null;
  avgCandidatesPerOpenRequisition: number | null;
  byDepartment: NamedCountDto[];
  byHiringPriority: Array<{ key: HiringPriority; count: number }>;
  byEmploymentType: Array<{ key: EmploymentType; count: number }>;
  byWorkMode: Array<{ key: WorkMode; count: number }>;
};

export type ReportFunnelDto = {
  filters: ReportFilters;
  stages: NamedCountDto[];
  exits: NamedCountDto[];
  conversions: ConversionRatioDto[];
};

export type ReportDepartmentRowDto = {
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  openRequisitions: number;
  openings: number;
  candidates: number;
  interviews: number;
  offersExtended: number;
  offersAccepted: number;
  joined: number;
  onboarded: number;
  avgDaysToJoin: number | null;
};

export type ReportDepartmentsDto = {
  filters: ReportFilters;
  rows: ReportDepartmentRowDto[];
};

export type ReportInterviewsDto = {
  filters: ReportFilters;
  byStatus: Array<{ status: InterviewStatus; count: number }>;
  byRoundType: Array<{ key: InterviewRoundType; count: number }>;
  byMode: Array<{ key: InterviewMode; count: number }>;
  completionRate: number | null;
  noShowRate: number | null;
  feedbackCoverage: number | null;
  avgRating: number | null;
  recommendations: Array<{
    key: InterviewRecommendation | "NONE";
    count: number;
  }>;
};

export type ReportOffersDto = {
  filters: ReportFilters;
  byStatus: Array<{ status: OfferStatus; count: number }>;
  avgApprovalDays: number | null;
  avgResponseDays: number | null;
  acceptRate: number | null;
  declineRate: number | null;
  withdrawRate: number | null;
  expireRate: number | null;
  avgSalaryByCurrency: CurrencyAverageDto[];
  pipeline: {
    pendingApproval: number;
    extendedAwaitingResponse: number;
  };
};

export type ReportOnboardingDto = {
  filters: ReportFilters;
  byStatus: Array<{ status: OnboardingCaseStatus; count: number }>;
  avgDaysStartToJoin: number | null;
  avgDaysJoinToComplete: number | null;
  taskCompletionRate: number | null;
  documentReadinessRate: number | null;
  cancelRate: number | null;
  topCancelReasons: NamedCountDto[];
};

export type ReportEmployeesDto = {
  filters: ReportFilters;
  byStatus: Array<{ status: EmployeeStatus; count: number }>;
  joinsInPeriod: number;
  withdrawalsInPeriod: number;
  byDepartment: NamedCountDto[];
  byEmploymentType: Array<{ key: EmploymentType; count: number }>;
  byWorkMode: Array<{ key: WorkMode; count: number }>;
};

export type ReportExportRequest = ReportFilters & {
  format: ReportExportFormat;
};
