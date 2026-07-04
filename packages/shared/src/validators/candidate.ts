import { z } from "zod";
import { CANDIDATE_STATUSES } from "../constants/candidate-status.js";

export const createCandidateSchema = z.object({
  requisitionId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(150),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(7).max(30),
  totalExperienceYears: z.coerce.number().min(0).max(60).optional(),
  skills: z.string().trim().max(2000).optional(),
  currentCompany: z.string().trim().max(150).optional(),
  currentLocation: z.string().trim().max(150).optional(),
  noticePeriodDays: z.coerce.number().int().min(0).max(3650).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const updateCandidateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(150).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    totalExperienceYears: z.coerce.number().min(0).max(60).nullable().optional(),
    skills: z.string().trim().max(2000).nullable().optional(),
    currentCompany: z.string().trim().max(150).nullable().optional(),
    currentLocation: z.string().trim().max(150).nullable().optional(),
    noticePeriodDays: z.coerce.number().int().min(0).max(3650).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listCandidatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(CANDIDATE_STATUSES).optional(),
  requisitionId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export const rejectCandidateSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  comments: z.string().trim().max(2000).optional(),
});

export const addCandidateNoteSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>;
export type RejectCandidateInput = z.infer<typeof rejectCandidateSchema>;
export type AddCandidateNoteInput = z.infer<typeof addCandidateNoteSchema>;

