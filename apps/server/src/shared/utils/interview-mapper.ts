import type {
  Interview,
  InterviewFeedback,
  InterviewInterviewer,
  JobRequisition,
  User,
  Candidate,
} from "@prisma/client";
import type {
  InterviewDto,
  InterviewMode,
  InterviewRoundType,
  InterviewStatus,
  InterviewTimelineItemDto,
  UserSummary,
} from "@roms/shared";

function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

type InterviewWithRelations = Interview & {
  candidate: Candidate;
  requisition: JobRequisition;
  createdBy: User;
  updatedBy: User | null;
  completedBy: User | null;
  cancelledBy: User | null;
  interviewers: Array<InterviewInterviewer & { user: User }>;
  feedbackItems: Array<InterviewFeedback & { createdBy: User }>;
};

function buildTimeline(interview: InterviewWithRelations): InterviewTimelineItemDto[] {
  const items: InterviewTimelineItemDto[] = [
    {
      key: "created",
      title: "Interview scheduled",
      detail: `Created by ${interview.createdBy.firstName} ${interview.createdBy.lastName}`,
      at: interview.createdAt.toISOString(),
    },
  ];

  if (interview.completedAt) {
    items.push({
      key: "completed",
      title: "Interview completed",
      detail: interview.completionNotes ?? null,
      at: interview.completedAt.toISOString(),
    });
  }

  if (interview.cancelledAt) {
    items.push({
      key: "cancelled",
      title: "Interview cancelled",
      detail: interview.cancellationReason ?? null,
      at: interview.cancelledAt.toISOString(),
    });
  }

  if (interview.status === "NO_SHOW") {
    items.push({
      key: "no-show",
      title: "Candidate marked as no-show",
      detail: interview.cancellationReason ?? null,
      at: interview.updatedAt.toISOString(),
    });
  }

  for (const feedback of interview.feedbackItems) {
    const author = `${feedback.createdBy.firstName} ${feedback.createdBy.lastName}`;
    const wasUpdated =
      feedback.updatedAt.getTime() - feedback.createdAt.getTime() > 1000;

    items.push({
      key: `feedback-${feedback.id}`,
      title: wasUpdated
        ? `Feedback updated by ${author}`
        : `Feedback submitted by ${author}`,
      detail: feedback.summary ?? feedback.recommendation ?? null,
      at: feedback.updatedAt.toISOString(),
    });
  }

  return items.sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function toInterviewDto(interview: InterviewWithRelations): InterviewDto {
  return {
    id: interview.id,
    candidate: {
      id: interview.candidate.id,
      fullName: interview.candidate.fullName,
      email: interview.candidate.email,
      status: interview.candidate.status,
    },
    requisition: {
      id: interview.requisition.id,
      title: interview.requisition.title,
      status: interview.requisition.status,
    },
    roundType: interview.roundType as InterviewRoundType,
    customRoundLabel: interview.customRoundLabel,
    sequence: interview.sequence,
    status: interview.status as InterviewStatus,
    scheduledAt: interview.scheduledAt.toISOString(),
    durationMinutes: interview.durationMinutes,
    mode: interview.mode as InterviewMode,
    location: interview.location,
    meetingLink: interview.meetingLink,
    instructions: interview.instructions,
    completionNotes: interview.completionNotes,
    cancellationReason: interview.cancellationReason,
    feedbackSummary: interview.feedbackSummary,
    interviewers: interview.interviewers.map((assignment) =>
      toUserSummary(assignment.user),
    ),
    feedbackItems: interview.feedbackItems.map((item) => ({
      id: item.id,
      rating: item.rating,
      recommendation: item.recommendation,
      strengths: item.strengths,
      concerns: item.concerns,
      summary: item.summary,
      createdBy: toUserSummary(item.createdBy),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    timeline: buildTimeline(interview),
    createdBy: toUserSummary(interview.createdBy),
    updatedBy: interview.updatedBy ? toUserSummary(interview.updatedBy) : null,
    completedBy: interview.completedBy
      ? toUserSummary(interview.completedBy)
      : null,
    completedAt: interview.completedAt?.toISOString() ?? null,
    cancelledBy: interview.cancelledBy
      ? toUserSummary(interview.cancelledBy)
      : null,
    cancelledAt: interview.cancelledAt?.toISOString() ?? null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

export const interviewInclude = {
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
} as const;
