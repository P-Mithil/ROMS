import type { Prisma, CandidateStatus } from "@prisma/client";
import type { ListCandidatesQuery } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { candidateInclude } from "../../shared/utils/candidate-mapper.js";

function buildWhere(
  query: ListCandidatesQuery,
  scope: Prisma.CandidateWhereInput,
): Prisma.CandidateWhereInput {
  const where: Prisma.CandidateWhereInput = {
    ...scope,
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status as CandidateStatus;
  }

  if (query.requisitionId) {
    where.requisitionId = query.requisitionId;
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { skills: { contains: query.search, mode: "insensitive" } },
      { currentCompany: { contains: query.search, mode: "insensitive" } },
      { requisition: { title: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export const candidatesRepository = {
  findMany(query: ListCandidatesQuery, scope: Prisma.CandidateWhereInput) {
    const where = buildWhere(query, scope);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.candidate.findMany({
        where,
        include: candidateInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.candidate.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.candidate.findFirst({
      where: { id, deletedAt: null },
      include: candidateInclude,
    });
  },

  create(data: {
    requisitionId: string;
    fullName: string;
    email: string;
    phone: string;
    totalExperienceYears?: Prisma.Decimal | null;
    skills?: string | null;
    currentCompany?: string | null;
    currentLocation?: string | null;
    noticePeriodDays?: number | null;
    notes?: string | null;
    createdById: string;
  }) {
    return prisma.candidate.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        updatedById: data.createdById,
        status: "APPLIED",
      },
      include: candidateInclude,
    });
  },

  update(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      totalExperienceYears?: Prisma.Decimal | null;
      skills?: string | null;
      currentCompany?: string | null;
      currentLocation?: string | null;
      noticePeriodDays?: number | null;
      notes?: string | null;
      status?: CandidateStatus;
      updatedById?: string;
      resumeFileName?: string | null;
      resumeFilePath?: string | null;
      resumeMimeType?: string | null;
      deletedAt?: Date | null;
      rejectionReason?: string | null;
      rejectionComments?: string | null;
      rejectedAt?: Date | null;
      rejectedById?: string | null;
      resumeUploadedAt?: Date | null;
      resumeUploadedById?: string | null;
    },
  ) {
    return prisma.candidate.update({
      where: { id },
      data,
      include: candidateInclude,
    });
  },

  createNote(candidateId: string, createdById: string, content: string) {
    return prisma.candidateNote.create({
      data: {
        candidateId,
        createdById,
        content,
      },
    });
  },
};

