import type {
  InterviewMode,
  InterviewRoundType,
  InterviewStatus,
  Prisma,
} from "@prisma/client";
import type { ListInterviewsQueryInput } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { interviewInclude } from "../../shared/utils/interview-mapper.js";

function buildWhere(
  query: ListInterviewsQueryInput,
  scope: Prisma.InterviewWhereInput,
): Prisma.InterviewWhereInput {
  const where: Prisma.InterviewWhereInput = {
    ...scope,
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status as InterviewStatus;
  }

  if (query.candidateId) {
    where.candidateId = query.candidateId;
  }

  if (query.requisitionId) {
    where.requisitionId = query.requisitionId;
  }

  if (query.interviewerId) {
    where.interviewers = {
      some: {
        userId: query.interviewerId,
      },
    };
  }

  if (query.roundType) {
    where.roundType = query.roundType as InterviewRoundType;
  }

  if (query.search) {
    where.OR = [
      { candidate: { fullName: { contains: query.search, mode: "insensitive" } } },
      { candidate: { email: { contains: query.search, mode: "insensitive" } } },
      { requisition: { title: { contains: query.search, mode: "insensitive" } } },
      { customRoundLabel: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export const interviewsRepository = {
  findMany(query: ListInterviewsQueryInput, scope: Prisma.InterviewWhereInput) {
    const where = buildWhere(query, scope);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.interview.findMany({
        where,
        include: interviewInclude,
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
        skip,
        take: query.limit,
      }),
      prisma.interview.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.interview.findFirst({
      where: { id, deletedAt: null },
      include: interviewInclude,
    });
  },

  findNextSequence(candidateId: string, roundType: InterviewRoundType) {
    return prisma.interview.aggregate({
      where: {
        candidateId,
        roundType,
        deletedAt: null,
      },
      _max: {
        sequence: true,
      },
    });
  },

  findScheduledForCandidate(candidateId: string, excludeId?: string) {
    return prisma.interview.findMany({
      where: {
        candidateId,
        deletedAt: null,
        status: "SCHEDULED",
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: interviewInclude,
    });
  },

  findScheduledForInterviewers(interviewerIds: string[], excludeId?: string) {
    return prisma.interview.findMany({
      where: {
        deletedAt: null,
        status: "SCHEDULED",
        ...(excludeId ? { id: { not: excludeId } } : {}),
        interviewers: {
          some: {
            userId: { in: interviewerIds },
          },
        },
      },
      include: interviewInclude,
    });
  },

  create(data: {
    candidateId: string;
    requisitionId: string;
    roundType: InterviewRoundType;
    customRoundLabel?: string | null;
    sequence: number;
    scheduledAt: Date;
    durationMinutes: number;
    mode: InterviewMode;
    location?: string | null;
    meetingLink?: string | null;
    instructions?: string | null;
    createdById: string;
    interviewerIds: string[];
  }) {
    return prisma.interview.create({
      data: {
        candidateId: data.candidateId,
        requisitionId: data.requisitionId,
        roundType: data.roundType,
        customRoundLabel: data.customRoundLabel ?? null,
        sequence: data.sequence,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        mode: data.mode,
        location: data.location ?? null,
        meetingLink: data.meetingLink ?? null,
        instructions: data.instructions ?? null,
        createdById: data.createdById,
        updatedById: data.createdById,
        interviewers: {
          create: data.interviewerIds.map((userId) => ({ userId })),
        },
      },
      include: interviewInclude,
    });
  },

  update(
    id: string,
    data: {
      roundType?: InterviewRoundType;
      customRoundLabel?: string | null;
      scheduledAt?: Date;
      durationMinutes?: number;
      mode?: InterviewMode;
      location?: string | null;
      meetingLink?: string | null;
      instructions?: string | null;
      status?: InterviewStatus;
      completionNotes?: string | null;
      feedbackSummary?: string | null;
      cancellationReason?: string | null;
      updatedById?: string | null;
      completedById?: string | null;
      completedAt?: Date | null;
      cancelledById?: string | null;
      cancelledAt?: Date | null;
      deletedAt?: Date | null;
      interviewerIds?: string[];
    },
  ) {
    const { interviewerIds, ...rest } = data;

    return prisma.interview.update({
      where: { id },
      data: {
        ...rest,
        ...(interviewerIds
          ? {
              interviewers: {
                deleteMany: {},
                create: interviewerIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: interviewInclude,
    });
  },
};
