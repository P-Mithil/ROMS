import type { Prisma } from "@prisma/client";
import type { ReportFiltersInput } from "@roms/shared";
import type { AuthenticatedUser } from "../../shared/types/express.js";

export type ResolvedReportFilters = {
  dateFrom: string;
  dateTo: string;
  dateFromDate: Date;
  dateToDate: Date;
  departmentId?: string;
  requisitionId?: string;
  search?: string;
  interviewDateBasis: "scheduledAt" | "completedAt";
  offerDateBasis: "createdAt" | "extendedAt" | "respondedAt";
  onboardingDateBasis: "createdAt" | "joinedAt";
};

export function resolveReportFilters(
  input: ReportFiltersInput,
): ResolvedReportFilters {
  const today = new Date();
  const dateTo =
    input.dateTo ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const from = new Date(today);
  from.setDate(from.getDate() - 89);
  const dateFrom =
    input.dateFrom ??
    `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;

  return {
    dateFrom,
    dateTo,
    dateFromDate: new Date(`${dateFrom}T00:00:00.000Z`),
    dateToDate: new Date(`${dateTo}T23:59:59.999Z`),
    departmentId: input.departmentId,
    requisitionId: input.requisitionId,
    search: input.search?.trim() || undefined,
    interviewDateBasis: input.interviewDateBasis ?? "scheduledAt",
    offerDateBasis: input.offerDateBasis ?? "createdAt",
    onboardingDateBasis: input.onboardingDateBasis ?? "createdAt",
  };
}

export function buildRequisitionScope(
  actor: AuthenticatedUser,
): Prisma.JobRequisitionWhereInput {
  if (actor.role === "RECRUITER") {
    return { createdById: actor.id };
  }
  if (actor.role === "HIRING_MANAGER") {
    return { hiringManagerId: actor.id };
  }
  return {};
}

export function requisitionLinkFilter(
  actor: AuthenticatedUser,
  filters: ResolvedReportFilters,
): Prisma.JobRequisitionWhereInput {
  return {
    deletedAt: null,
    ...buildRequisitionScope(actor),
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.requisitionId ? { id: filters.requisitionId } : {}),
  };
}

export function candidateWhere(
  actor: AuthenticatedUser,
  filters: ResolvedReportFilters,
  options?: { createdInRange?: boolean },
): Prisma.CandidateWhereInput {
  return {
    deletedAt: null,
    requisition: requisitionLinkFilter(actor, filters),
    ...(options?.createdInRange
      ? {
          createdAt: {
            gte: filters.dateFromDate,
            lte: filters.dateToDate,
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function avg(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

export function toPublicFilters(
  filters: ResolvedReportFilters,
): Omit<
  ResolvedReportFilters,
  "dateFromDate" | "dateToDate"
> {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    departmentId: filters.departmentId,
    requisitionId: filters.requisitionId,
    search: filters.search,
    interviewDateBasis: filters.interviewDateBasis,
    offerDateBasis: filters.offerDateBasis,
    onboardingDateBasis: filters.onboardingDateBasis,
  };
}
