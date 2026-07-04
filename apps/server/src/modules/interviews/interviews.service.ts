import type { InterviewRoundType, Prisma } from "@prisma/client";
import type {
  CancelInterviewInput,
  CompleteInterviewInput,
  CreateInterviewInput,
  CreateInterviewFeedbackInput,
  ListInterviewsQueryInput,
  NoShowInterviewInput,
  UpdateFeedbackSummaryInput,
  UpdateInterviewInput,
} from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import { toInterviewDto } from "../../shared/utils/interview-mapper.js";
import { interviewsRepository } from "./interviews.repository.js";

type Actor = AuthenticatedUser;

function buildScope(actor: Actor): Prisma.InterviewWhereInput {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }

  if (actor.role === "INTERVIEWER") {
    return {
      interviewers: {
        some: {
          userId: actor.id,
        },
      },
    };
  }

  throw new ForbiddenError("You do not have access to interviews");
}

function assertCanManage(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError("You do not have access to manage interviews");
}

function assertCanManagePanelSummary(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError(
    "You do not have access to update the interview panel summary",
  );
}

function assertAssignedInterviewer(
  interview: { interviewers: Array<{ userId: string }> },
  actor: Actor,
) {
  const isAssigned = interview.interviewers.some(
    (assignment) => assignment.userId === actor.id,
  );

  if (!isAssigned) {
    throw new ForbiddenError(
      "You can only submit feedback for interviews you are assigned to",
    );
  }
}

function assertCanComplete(actor: Actor) {
  if (
    actor.role === "HR_ADMIN" ||
    actor.role === "RECRUITER" ||
    actor.role === "HIRING_MANAGER"
  ) {
    return;
  }

  throw new ForbiddenError("You do not have access to complete interviews");
}

function ensureWritable(interview: {
  status: string;
  cancelledAt: Date | null;
  completedAt: Date | null;
}) {
  if (
    interview.status === "COMPLETED" ||
    interview.status === "CANCELLED" ||
    interview.cancelledAt ||
    interview.completedAt
  ) {
    throw new BadRequestError(
      "Completed or cancelled interviews are read-only",
      "READ_ONLY_INTERVIEW",
    );
  }
}

function getEndTime(scheduledAt: Date, durationMinutes: number) {
  return new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

function validateInterviewLogistics(input: {
  roundType: string;
  customRoundLabel: string | null;
  mode: string;
  location: string | null;
  meetingLink: string | null;
}) {
  if (input.roundType === "CUSTOM" && !input.customRoundLabel?.trim()) {
    throw new BadRequestError("Custom round label is required");
  }

  if (input.mode === "VIRTUAL" && !input.meetingLink?.trim()) {
    throw new BadRequestError("Meeting link is required for virtual interviews");
  }

  if (input.mode === "IN_PERSON" && !input.location?.trim()) {
    throw new BadRequestError("Location is required for in-person interviews");
  }
}

async function getScopedInterview(id: string, actor: Actor) {
  const interview = await interviewsRepository.findById(id);
  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  const scope = buildScope(actor);
  const scoped = await prisma.interview.findFirst({
    where: {
      id: interview.id,
      deletedAt: null,
      ...scope,
    },
    include: {
      candidate: true,
      requisition: true,
      createdBy: true,
      updatedBy: true,
      completedBy: true,
      cancelledBy: true,
      interviewers: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      feedbackItems: {
        include: {
          createdBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!scoped) {
    throw new ForbiddenError("You do not have access to this interview");
  }

  return scoped;
}

async function validateCandidateForScheduling(candidateId: string, actor: Actor) {
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      deletedAt: null,
    },
    include: {
      requisition: true,
    },
  });

  if (!candidate) {
    throw new BadRequestError("Candidate not found");
  }

  if (candidate.status !== "SHORTLISTED") {
    throw new BadRequestError(
      "Candidate must be SHORTLISTED before an interview can be scheduled",
      "INVALID_CANDIDATE_STATUS",
    );
  }

  if (candidate.requisition.deletedAt || candidate.requisition.status !== "OPEN") {
    throw new BadRequestError(
      "Interviews can only be scheduled for OPEN requisitions",
      "INVALID_REQUISITION_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return candidate;
  }

  if (
    actor.role === "RECRUITER" &&
    candidate.requisition.createdById === actor.id
  ) {
    return candidate;
  }

  if (
    actor.role === "HIRING_MANAGER" &&
    candidate.requisition.hiringManagerId === actor.id
  ) {
    return candidate;
  }

  throw new ForbiddenError("You do not have access to this candidate");
}

async function validateInterviewers(interviewerIds: string[]) {
  const uniqueIds = [...new Set(interviewerIds)];
  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      isActive: true,
      role: { name: "INTERVIEWER" },
    },
  });

  if (users.length !== uniqueIds.length) {
    throw new BadRequestError("One or more interviewers are invalid or inactive");
  }
}

async function validateConflicts(input: {
  candidateId: string;
  interviewerIds: string[];
  scheduledAt: Date;
  durationMinutes: number;
  excludeInterviewId?: string;
}) {
  const targetEnd = getEndTime(input.scheduledAt, input.durationMinutes);

  const candidateInterviews = await interviewsRepository.findScheduledForCandidate(
    input.candidateId,
    input.excludeInterviewId,
  );

  for (const interview of candidateInterviews) {
    const existingEnd = getEndTime(interview.scheduledAt, interview.durationMinutes);
    if (overlaps(input.scheduledAt, targetEnd, interview.scheduledAt, existingEnd)) {
      throw new BadRequestError(
        "Candidate already has an overlapping interview",
        "CANDIDATE_INTERVIEW_CONFLICT",
      );
    }
  }

  const interviewerInterviews =
    await interviewsRepository.findScheduledForInterviewers(
      input.interviewerIds,
      input.excludeInterviewId,
    );

  for (const interview of interviewerInterviews) {
    const existingEnd = getEndTime(interview.scheduledAt, interview.durationMinutes);
    if (overlaps(input.scheduledAt, targetEnd, interview.scheduledAt, existingEnd)) {
      throw new BadRequestError(
        "One or more interviewers already have an overlapping interview",
        "INTERVIEWER_CONFLICT",
      );
    }
  }
}

async function getNextSequence(candidateId: string, roundType: InterviewRoundType) {
  const result = await interviewsRepository.findNextSequence(candidateId, roundType);
  return (result._max.sequence ?? 0) + 1;
}

export const interviewsService = {
  async list(query: ListInterviewsQueryInput, actor: Actor) {
    const scope = buildScope(actor);
    const [items, total] = await interviewsRepository.findMany(query, scope);

    return {
      items: items.map(toInterviewDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, actor: Actor) {
    const interview = await getScopedInterview(id, actor);
    return toInterviewDto(interview);
  },

  async create(input: CreateInterviewInput, actor: Actor) {
    assertCanManage(actor);
    const candidate = await validateCandidateForScheduling(input.candidateId, actor);
    await validateInterviewers(input.interviewerIds);
    validateInterviewLogistics({
      roundType: input.roundType,
      customRoundLabel: input.customRoundLabel ?? null,
      mode: input.mode,
      location: input.location ?? null,
      meetingLink: input.meetingLink ?? null,
    });

    const scheduledAt = new Date(input.scheduledAt);
    await validateConflicts({
      candidateId: candidate.id,
      interviewerIds: input.interviewerIds,
      scheduledAt,
      durationMinutes: input.durationMinutes,
    });

    const sequence = await getNextSequence(candidate.id, input.roundType);

    const interview = await interviewsRepository.create({
      candidateId: candidate.id,
      requisitionId: candidate.requisitionId,
      roundType: input.roundType,
      customRoundLabel: input.customRoundLabel ?? null,
      sequence,
      scheduledAt,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      location: input.location ?? null,
      meetingLink: input.meetingLink ?? null,
      instructions: input.instructions ?? null,
      createdById: actor.id,
      interviewerIds: [...new Set(input.interviewerIds)],
    });

    return toInterviewDto(interview);
  },

  async update(id: string, input: UpdateInterviewInput, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedInterview(id, actor);
    ensureWritable(existing);
    await validateCandidateForScheduling(existing.candidateId, actor);

    const nextRoundType = input.roundType ?? existing.roundType;
    const nextScheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : existing.scheduledAt;
    const nextDuration = input.durationMinutes ?? existing.durationMinutes;
    const nextInterviewerIds =
      input.interviewerIds ?? existing.interviewers.map((assignment) => assignment.userId);
    const nextMode = input.mode ?? existing.mode;
    const nextLocation =
      input.location !== undefined ? input.location : existing.location;
    const nextMeetingLink =
      input.meetingLink !== undefined ? input.meetingLink : existing.meetingLink;
    const nextCustomRoundLabel =
      input.customRoundLabel !== undefined
        ? input.customRoundLabel
        : existing.customRoundLabel;

    await validateInterviewers(nextInterviewerIds);
    validateInterviewLogistics({
      roundType: nextRoundType,
      customRoundLabel: nextCustomRoundLabel,
      mode: nextMode,
      location: nextLocation,
      meetingLink: nextMeetingLink,
    });
    await validateConflicts({
      candidateId: existing.candidateId,
      interviewerIds: nextInterviewerIds,
      scheduledAt: nextScheduledAt,
      durationMinutes: nextDuration,
      excludeInterviewId: existing.id,
    });

    const sequence =
      nextRoundType === existing.roundType
        ? existing.sequence
        : await getNextSequence(existing.candidateId, nextRoundType);

    const interview = await interviewsRepository.update(existing.id, {
      roundType: nextRoundType,
      customRoundLabel:
        input.customRoundLabel !== undefined
          ? input.customRoundLabel
          : existing.customRoundLabel,
      scheduledAt: nextScheduledAt,
      durationMinutes: nextDuration,
      mode: nextMode,
      location: nextLocation,
      meetingLink: nextMeetingLink,
      instructions:
        input.instructions !== undefined
          ? input.instructions
          : existing.instructions,
      updatedById: actor.id,
      interviewerIds: [...new Set(nextInterviewerIds)],
      ...(sequence !== existing.sequence ? { sequence } : {}),
    });

    return toInterviewDto(interview);
  },

  async delete(id: string, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedInterview(id, actor);
    ensureWritable(existing);

    await interviewsRepository.update(existing.id, {
      deletedAt: new Date(),
      updatedById: actor.id,
    });
  },

  async cancel(id: string, input: CancelInterviewInput, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedInterview(id, actor);
    ensureWritable(existing);

    const interview = await interviewsRepository.update(existing.id, {
      status: "CANCELLED",
      cancellationReason: input.reason,
      cancelledById: actor.id,
      cancelledAt: new Date(),
      updatedById: actor.id,
    });

    return toInterviewDto(interview);
  },

  async complete(id: string, input: CompleteInterviewInput, actor: Actor) {
    assertCanComplete(actor);
    const existing = await getScopedInterview(id, actor);
    ensureWritable(existing);

    const interview = await interviewsRepository.update(existing.id, {
      status: "COMPLETED",
      completionNotes: input.completionNotes ?? null,
      feedbackSummary: input.feedbackSummary ?? null,
      completedById: actor.id,
      completedAt: new Date(),
      updatedById: actor.id,
    });

    return toInterviewDto(interview);
  },

  async markNoShow(id: string, input: NoShowInterviewInput, actor: Actor) {
    assertCanComplete(actor);
    const existing = await getScopedInterview(id, actor);
    ensureWritable(existing);

    if (existing.scheduledAt > new Date()) {
      throw new BadRequestError(
        "Interview can only be marked no-show after its scheduled time",
        "INVALID_INTERVIEW_STATUS",
      );
    }

    const interview = await interviewsRepository.update(existing.id, {
      status: "NO_SHOW",
      cancellationReason: input.reason,
      updatedById: actor.id,
    });

    return toInterviewDto(interview);
  },

  async createFeedback(
    id: string,
    input: CreateInterviewFeedbackInput,
    actor: Actor,
  ) {
    const interview = await getScopedInterview(id, actor);

    if (
      actor.role !== "INTERVIEWER" &&
      actor.role !== "HIRING_MANAGER" &&
      actor.role !== "HR_ADMIN" &&
      actor.role !== "RECRUITER"
    ) {
      throw new ForbiddenError("You do not have access to submit interview feedback");
    }

    if (interview.status !== "COMPLETED" && interview.status !== "NO_SHOW") {
      throw new BadRequestError(
        "Feedback can only be submitted for completed or no-show interviews",
        "INVALID_INTERVIEW_STATUS",
      );
    }

    if (actor.role === "INTERVIEWER") {
      assertAssignedInterviewer(interview, actor);
    }

    const created = await prisma.interviewFeedback.upsert({
      where: {
        interviewId_createdById: {
          interviewId: interview.id,
          createdById: actor.id,
        },
      },
      update: {
        rating: input.rating ?? null,
        recommendation: input.recommendation ?? null,
        strengths: input.strengths ?? null,
        concerns: input.concerns ?? null,
        summary: input.summary ?? null,
      },
      create: {
        interviewId: interview.id,
        createdById: actor.id,
        rating: input.rating ?? null,
        recommendation: input.recommendation ?? null,
        strengths: input.strengths ?? null,
        concerns: input.concerns ?? null,
        summary: input.summary ?? null,
      },
    });

    const refreshed = await getScopedInterview(interview.id, actor);
    return {
      interview: toInterviewDto(refreshed),
      feedbackId: created.id,
    };
  },

  async updateFeedbackSummary(
    id: string,
    input: UpdateFeedbackSummaryInput,
    actor: Actor,
  ) {
    assertCanManagePanelSummary(actor);
    const interview = await getScopedInterview(id, actor);

    if (interview.status !== "COMPLETED") {
      throw new BadRequestError(
        "Panel summary can only be updated for completed interviews",
        "INVALID_INTERVIEW_STATUS",
      );
    }

    const updated = await interviewsRepository.update(interview.id, {
      feedbackSummary: input.feedbackSummary,
      updatedById: actor.id,
    });

    return toInterviewDto(updated);
  },
};
