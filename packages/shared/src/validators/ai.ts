import { z } from "zod";
import {
  AI_EMAIL_TEMPLATES,
  AI_NOTE_INTENTS,
} from "../constants/ai.js";
import { INTERVIEW_ROUND_TYPES } from "../constants/interview-metadata.js";

export const normalizeSkillsSchema = z.object({
  skills: z.string().trim().min(1).max(4000),
});

export const generateJdSchema = z.object({
  title: z.string().trim().min(1).max(200),
  departmentName: z.string().trim().max(150).optional(),
  employmentType: z.string().trim().max(50).optional(),
  workMode: z.string().trim().max(50).optional(),
  experienceMin: z.coerce.number().min(0).max(50).optional(),
  experienceMax: z.coerce.number().min(0).max(50).optional(),
  skills: z.string().trim().max(2000).optional(),
  tone: z.enum(["formal", "friendly"]).optional(),
});

export const generateQuestionsSchema = z.object({
  candidateId: z.string().uuid(),
  roundType: z.enum(INTERVIEW_ROUND_TYPES),
  customRoundLabel: z.string().trim().max(100).optional(),
});

export const generateEmailSchema = z.object({
  template: z.enum(AI_EMAIL_TEMPLATES),
  candidateId: z.string().uuid(),
  interviewId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  offerLink: z.string().url().max(1000).optional(),
  joiningDate: z.string().date().optional(),
});

export const draftNoteSchema = z.object({
  intent: z.enum(AI_NOTE_INTENTS).default("GENERAL"),
  hint: z.string().trim().max(1000).optional(),
});

export const compareCandidatesSchema = z
  .object({
    candidateIds: z.array(z.string().uuid()).min(2).max(3),
    requisitionId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    const unique = new Set(data.candidateIds);
    if (unique.size !== data.candidateIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "candidateIds must be unique",
        path: ["candidateIds"],
      });
    }
  });

export const insightsFiltersSchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  departmentId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
});

export type NormalizeSkillsInput = z.infer<typeof normalizeSkillsSchema>;
export type GenerateJdInput = z.infer<typeof generateJdSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type GenerateEmailInput = z.infer<typeof generateEmailSchema>;
export type DraftNoteInput = z.infer<typeof draftNoteSchema>;
export type CompareCandidatesInput = z.infer<typeof compareCandidatesSchema>;
export type InsightsFiltersInput = z.infer<typeof insightsFiltersSchema>;
