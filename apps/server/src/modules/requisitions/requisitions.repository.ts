import type { Prisma, RequisitionStatus } from "@prisma/client";
import type { ListRequisitionsQuery } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { requisitionInclude } from "../../shared/utils/requisition-mapper.js";

function buildBaseWhere(
  query: ListRequisitionsQuery,
  scope: Prisma.JobRequisitionWhereInput,
  includeStatus: boolean,
): Prisma.JobRequisitionWhereInput {
  const where: Prisma.JobRequisitionWhereInput = {
    ...scope,
    deletedAt: null,
  };

  if (includeStatus && query.status) {
    where.status = query.status as RequisitionStatus;
  }

  if (query.hiringPriority) {
    where.hiringPriority = query.hiringPriority;
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.workMode) {
    where.workMode = query.workMode;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { skills: { contains: query.search, mode: "insensitive" } },
      { department: { name: { contains: query.search, mode: "insensitive" } } },
      { hiringManager: { firstName: { contains: query.search, mode: "insensitive" } } },
      { hiringManager: { lastName: { contains: query.search, mode: "insensitive" } } },
      { hiringManager: { email: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export const requisitionsRepository = {
  findMany(query: ListRequisitionsQuery, scope: Prisma.JobRequisitionWhereInput) {
    const where = buildBaseWhere(query, scope, true);
    const summaryWhere = buildBaseWhere(query, scope, false);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.jobRequisition.findMany({
        where,
        include: requisitionInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.jobRequisition.count({ where }),
      prisma.jobRequisition.count({ where: summaryWhere }),
      prisma.jobRequisition.count({
        where: { ...summaryWhere, status: "OPEN" },
      }),
      prisma.jobRequisition.count({
        where: { ...summaryWhere, status: "PENDING_APPROVAL" },
      }),
      prisma.jobRequisition.count({
        where: { ...summaryWhere, status: "CLOSED" },
      }),
      prisma.jobRequisition.aggregate({
        where: summaryWhere,
        _sum: {
          openings: true,
        },
      }),
      prisma.candidate.count({
        where: {
          deletedAt: null,
          requisition: summaryWhere,
        },
      }),
      prisma.candidate.count({
        where: {
          deletedAt: null,
          status: "SHORTLISTED",
          requisition: summaryWhere,
        },
      }),
    ]);
  },

  findById(id: string) {
    return prisma.jobRequisition.findFirst({
      where: { id, deletedAt: null },
      include: requisitionInclude,
    });
  },

  create(data: {
    title: string;
    description?: string | null;
    skills?: string | null;
    departmentId: string;
    hiringManagerId: string;
    createdById: string;
    hiringPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    openings: number;
    employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" | "PART_TIME";
    workMode: "OFFICE" | "HYBRID" | "REMOTE";
    salaryMin?: number | null;
    salaryMax?: number | null;
    experienceMin?: Prisma.Decimal | null;
    experienceMax?: Prisma.Decimal | null;
  }) {
    return prisma.jobRequisition.create({
      data: {
        ...data,
        status: "DRAFT",
      },
      include: requisitionInclude,
    });
  },

  update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      skills?: string | null;
      departmentId?: string;
      hiringManagerId?: string;
      hiringPriority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      openings?: number;
      employmentType?: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" | "PART_TIME";
      workMode?: "OFFICE" | "HYBRID" | "REMOTE";
      salaryMin?: number | null;
      salaryMax?: number | null;
      experienceMin?: Prisma.Decimal | null;
      experienceMax?: Prisma.Decimal | null;
      status?: RequisitionStatus;
      submittedAt?: Date | null;
      approvedById?: string | null;
      approvedAt?: Date | null;
      rejectedAt?: Date | null;
      rejectionReason?: string | null;
      closedById?: string | null;
      closedAt?: Date | null;
      closeReason?: string | null;
      deletedAt?: Date | null;
    },
  ) {
    return prisma.jobRequisition.update({
      where: { id },
      data,
      include: requisitionInclude,
    });
  },
};
