import { z } from "zod";
import { INTERVIEW_RECOMMENDATIONS } from "../constants/interview-feedback.js";
import { INTERVIEW_STATUSES } from "../constants/interview-status.js";
import {
  INTERVIEW_MODES,
  INTERVIEW_ROUND_TYPES,
} from "../constants/interview-metadata.js";

const uuidArraySchema = z.array(z.string().uuid()).min(1).max(10);

export const createInterviewSchema = z
  .object({
    candidateId: z.string().uuid(),
    roundType: z.enum(INTERVIEW_ROUND_TYPES),
    customRoundLabel: z.string().trim().max(100).optional(),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.coerce.number().int().min(15).max(240),
    mode: z.enum(INTERVIEW_MODES),
    location: z.string().trim().max(255).optional(),
    meetingLink: z.string().trim().url().max(500).optional(),
    instructions: z.string().trim().max(5000).optional(),
    interviewerIds: uuidArraySchema,
  })
  .superRefine((data, ctx) => {
    if (data.roundType === "CUSTOM" && !data.customRoundLabel?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom round label is required",
        path: ["customRoundLabel"],
      });
    }

    if (data.mode === "VIRTUAL" && !data.meetingLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Meeting link is required for virtual interviews",
        path: ["meetingLink"],
      });
    }

    if (data.mode === "IN_PERSON" && !data.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location is required for in-person interviews",
        path: ["location"],
      });
    }
  });

export const updateInterviewSchema = z
  .object({
    roundType: z.enum(INTERVIEW_ROUND_TYPES).optional(),
    customRoundLabel: z.string().trim().max(100).nullable().optional(),
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
    mode: z.enum(INTERVIEW_MODES).optional(),
    location: z.string().trim().max(255).nullable().optional(),
    meetingLink: z.string().trim().url().max(500).nullable().optional(),
    instructions: z.string().trim().max(5000).nullable().optional(),
    interviewerIds: uuidArraySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine((data, ctx) => {
    const nextMode = data.mode;
    const nextRoundType = data.roundType;

    if (nextRoundType === "CUSTOM" && !data.customRoundLabel?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom round label is required",
        path: ["customRoundLabel"],
      });
    }

    if (nextMode === "VIRTUAL" && data.meetingLink === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Meeting link is required for virtual interviews",
        path: ["meetingLink"],
      });
    }

    if (nextMode === "IN_PERSON" && data.location === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location is required for in-person interviews",
        path: ["location"],
      });
    }
  });

export const listInterviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(INTERVIEW_STATUSES).optional(),
  candidateId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
  interviewerId: z.string().uuid().optional(),
  roundType: z.enum(INTERVIEW_ROUND_TYPES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const cancelInterviewSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const completeInterviewSchema = z.object({
  completionNotes: z.string().trim().max(5000).optional(),
  feedbackSummary: z.string().trim().max(5000).optional(),
});

export const noShowInterviewSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const createInterviewFeedbackSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    recommendation: z.enum(INTERVIEW_RECOMMENDATIONS).optional(),
    strengths: z.string().trim().max(5000).optional(),
    concerns: z.string().trim().max(5000).optional(),
    summary: z.string().trim().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasRating = data.rating != null;
    const hasRecommendation = Boolean(data.recommendation);
    const hasStrengths = Boolean(data.strengths?.trim());
    const hasConcerns = Boolean(data.concerns?.trim());
    const hasSummary = Boolean(data.summary?.trim());

    if (
      !hasRating &&
      !hasRecommendation &&
      !hasStrengths &&
      !hasConcerns &&
      !hasSummary
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one feedback field must be provided",
        path: ["summary"],
      });
    }
  });

export const updateFeedbackSummarySchema = z.object({
  feedbackSummary: z.string().trim().max(5000).nullable(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type ListInterviewsQueryInput = z.infer<typeof listInterviewsQuerySchema>;
export type CancelInterviewInput = z.infer<typeof cancelInterviewSchema>;
export type CompleteInterviewInput = z.infer<typeof completeInterviewSchema>;
export type NoShowInterviewInput = z.infer<typeof noShowInterviewSchema>;
export type CreateInterviewFeedbackInput = z.infer<
  typeof createInterviewFeedbackSchema
>;
export type UpdateFeedbackSummaryInput = z.infer<
  typeof updateFeedbackSummarySchema
>;
