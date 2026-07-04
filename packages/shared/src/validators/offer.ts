import { z } from "zod";
import { OFFER_STATUSES } from "../constants/offer-status.js";
import { EMPLOYMENT_TYPES, WORK_MODES } from "../constants/requisition-metadata.js";

const currencySchema = z.string().trim().length(3).toUpperCase();

const offerFieldsSchema = {
  jobTitle: z.string().trim().min(1).max(200),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  baseSalary: z.coerce.number().int().positive(),
  currency: currencySchema.optional(),
  joiningDate: z.string().date(),
  validUntil: z.string().datetime(),
  terms: z.string().trim().max(10000).optional(),
  internalNotes: z.string().trim().max(5000).optional(),
};

export const createOfferSchema = z
  .object({
    candidateId: z.string().uuid(),
    ...offerFieldsSchema,
    jobTitle: offerFieldsSchema.jobTitle.optional(),
    employmentType: offerFieldsSchema.employmentType.optional(),
    workMode: offerFieldsSchema.workMode.optional(),
  })
  .superRefine((data, ctx) => {
    const joiningDate = new Date(`${data.joiningDate}T00:00:00`);
    const validUntil = new Date(data.validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (joiningDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Joining date must be today or in the future",
        path: ["joiningDate"],
      });
    }

    if (validUntil <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Offer validity must be in the future",
        path: ["validUntil"],
      });
    }
  });

export const updateOfferSchema = z
  .object({
    jobTitle: offerFieldsSchema.jobTitle.optional(),
    employmentType: offerFieldsSchema.employmentType.optional(),
    workMode: offerFieldsSchema.workMode.optional(),
    baseSalary: offerFieldsSchema.baseSalary.optional(),
    currency: currencySchema.optional(),
    joiningDate: offerFieldsSchema.joiningDate.optional(),
    validUntil: offerFieldsSchema.validUntil.optional(),
    terms: z.string().trim().max(10000).nullable().optional(),
    internalNotes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listOffersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(OFFER_STATUSES).optional(),
  candidateId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export const rejectOfferApprovalSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const withdrawOfferSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const recordOfferAcceptanceSchema = z.object({
  notes: z.string().trim().max(5000).optional(),
});

export const recordOfferDeclineSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  notes: z.string().trim().max(5000).optional(),
});

export const publicDeclineOfferSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type ListOffersQueryInput = z.infer<typeof listOffersQuerySchema>;
export type RejectOfferApprovalInput = z.infer<typeof rejectOfferApprovalSchema>;
export type WithdrawOfferInput = z.infer<typeof withdrawOfferSchema>;
export type RecordOfferAcceptanceInput = z.infer<typeof recordOfferAcceptanceSchema>;
export type RecordOfferDeclineInput = z.infer<typeof recordOfferDeclineSchema>;
export type PublicDeclineOfferInput = z.infer<typeof publicDeclineOfferSchema>;
