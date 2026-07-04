import type { JobRequisition, User } from "@prisma/client";
import type { JobRequisitionDto, UserSummary } from "@roms/shared";
import type { RequisitionStatus } from "@roms/shared";

type RequisitionWithRelations = JobRequisition & {
  department: { id: string; name: string };
  hiringManager: User;
  createdBy: User;
  approvedBy: User | null;
  closedBy: User | null;
  candidates: Array<{ id: string; status: string }>;
  _count?: {
    offers: number;
  };
};

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export function toRequisitionDto(
  requisition: RequisitionWithRelations,
): JobRequisitionDto {
  return {
    id: requisition.id,
    title: requisition.title,
    description: requisition.description,
    skills: requisition.skills,
    status: requisition.status as RequisitionStatus,
    hiringPriority: requisition.hiringPriority,
    openings: requisition.openings,
    employmentType: requisition.employmentType,
    workMode: requisition.workMode,
    salaryMin: requisition.salaryMin,
    salaryMax: requisition.salaryMax,
    experienceMin: requisition.experienceMin
      ? String(requisition.experienceMin)
      : null,
    experienceMax: requisition.experienceMax
      ? String(requisition.experienceMax)
      : null,
    candidateCount: "candidates" in requisition ? requisition.candidates.length : 0,
    shortlistedCount:
      "candidates" in requisition
        ? requisition.candidates.filter((candidate) => candidate.status === "SHORTLISTED")
            .length
        : 0,
    filledPositions: requisition._count?.offers ?? 0,
    department: {
      id: requisition.department.id,
      name: requisition.department.name,
    },
    hiringManager: toUserSummary(requisition.hiringManager),
    createdBy: toUserSummary(requisition.createdBy),
    approvedBy: requisition.approvedBy
      ? toUserSummary(requisition.approvedBy)
      : null,
    approvedAt: requisition.approvedAt?.toISOString() ?? null,
    submittedAt: requisition.submittedAt?.toISOString() ?? null,
    rejectedAt: requisition.rejectedAt?.toISOString() ?? null,
    rejectionReason: requisition.rejectionReason,
    closedBy: requisition.closedBy ? toUserSummary(requisition.closedBy) : null,
    closedAt: requisition.closedAt?.toISOString() ?? null,
    closeReason: requisition.closeReason,
    createdAt: requisition.createdAt.toISOString(),
    updatedAt: requisition.updatedAt.toISOString(),
  };
}

export const requisitionInclude = {
  department: true,
  hiringManager: true,
  createdBy: true,
  approvedBy: true,
  closedBy: true,
  candidates: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  },
  _count: {
    select: {
      offers: {
        where: {
          status: "ACCEPTED",
          deletedAt: null,
        },
      },
    },
  },
} as const;
