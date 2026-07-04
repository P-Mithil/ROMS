import type { InterviewStatus } from "../constants/interview-status.js";
import type {
  InterviewMode,
  InterviewRoundType,
} from "../constants/interview-metadata.js";
import type { PaginationMeta } from "./user.js";
import type { UserSummary } from "./requisition.js";

export type InterviewCandidateSummary = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

export type InterviewRequisitionSummary = {
  id: string;
  title: string;
  status: string;
};

export type InterviewTimelineItemDto = {
  key: string;
  title: string;
  detail: string | null;
  at: string;
};

export type InterviewFeedbackDto = {
  id: string;
  rating: number | null;
  recommendation: string | null;
  strengths: string | null;
  concerns: string | null;
  summary: string | null;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
};

export type InterviewDto = {
  id: string;
  candidate: InterviewCandidateSummary;
  requisition: InterviewRequisitionSummary;
  roundType: InterviewRoundType;
  customRoundLabel: string | null;
  sequence: number;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  location: string | null;
  meetingLink: string | null;
  instructions: string | null;
  completionNotes: string | null;
  cancellationReason: string | null;
  feedbackSummary: string | null;
  interviewers: UserSummary[];
  feedbackItems: InterviewFeedbackDto[];
  timeline: InterviewTimelineItemDto[];
  createdBy: UserSummary;
  updatedBy: UserSummary | null;
  completedBy: UserSummary | null;
  completedAt: string | null;
  cancelledBy: UserSummary | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInterviewRequest = {
  candidateId: string;
  roundType: InterviewRoundType;
  customRoundLabel?: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  instructions?: string;
  interviewerIds: string[];
};

export type UpdateInterviewRequest = {
  roundType?: InterviewRoundType;
  customRoundLabel?: string | null;
  scheduledAt?: string;
  durationMinutes?: number;
  mode?: InterviewMode;
  location?: string | null;
  meetingLink?: string | null;
  instructions?: string | null;
  interviewerIds?: string[];
};

export type CancelInterviewRequest = {
  reason: string;
};

export type CompleteInterviewRequest = {
  completionNotes?: string;
  feedbackSummary?: string;
};

export type NoShowInterviewRequest = {
  reason: string;
};

export type CreateInterviewFeedbackRequest = {
  rating?: number;
  recommendation?: string;
  strengths?: string;
  concerns?: string;
  summary?: string;
};

export type UpdateFeedbackSummaryRequest = {
  feedbackSummary: string | null;
};

export type ListInterviewsQuery = {
  page: number;
  limit: number;
  status?: InterviewStatus;
  candidateId?: string;
  requisitionId?: string;
  interviewerId?: string;
  roundType?: InterviewRoundType;
  search?: string;
};

export type PaginatedInterviews = {
  items: InterviewDto[];
  meta: PaginationMeta;
};
