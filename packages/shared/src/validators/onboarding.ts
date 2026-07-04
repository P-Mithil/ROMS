import { z } from "zod";
import { ONBOARDING_CASE_STATUSES } from "../constants/onboarding-case-status.js";
const currencySchema = z.string().trim().length(3).toUpperCase();

export const startOnboardingSchema = z.object({
  fullName: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  workEmail: z.string().trim().email().optional(),
  jobTitle: z.string().trim().min(1).max(200).optional(),
  departmentId: z.string().uuid().optional(),
  expectedJoiningDate: z.string().date().optional(),
  baseSalary: z.coerce.number().int().positive().optional(),
  currency: currencySchema.optional(),
});

export const confirmJoiningSchema = z.object({
  actualJoiningDate: z.string().date(),
  notes: z.string().trim().max(1000).optional(),
});

export const cancelOnboardingSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const updateOnboardingTaskSchema = z
  .object({
    status: z.enum(["PENDING", "IN_PROGRESS"]).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const skipOnboardingTaskSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const waiveOnboardingDocumentSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const listOnboardingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ONBOARDING_CASE_STATUSES).optional(),
  candidateId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export type StartOnboardingInput = z.infer<typeof startOnboardingSchema>;
export type ConfirmJoiningInput = z.infer<typeof confirmJoiningSchema>;
export type CancelOnboardingInput = z.infer<typeof cancelOnboardingSchema>;
export type UpdateOnboardingTaskInput = z.infer<typeof updateOnboardingTaskSchema>;
export type SkipOnboardingTaskInput = z.infer<typeof skipOnboardingTaskSchema>;
export type WaiveOnboardingDocumentInput = z.infer<
  typeof waiveOnboardingDocumentSchema
>;
export type ListOnboardingQueryInput = z.infer<typeof listOnboardingQuerySchema>;
