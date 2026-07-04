import { z } from "zod";
import { REQUISITION_STATUSES } from "../constants/requisition-status.js";
import {
  EMPLOYMENT_TYPES,
  HIRING_PRIORITIES,
  WORK_MODES,
} from "../constants/requisition-metadata.js";

export const createRequisitionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  skills: z.string().trim().max(2000).optional(),
  departmentId: z.string().uuid(),
  hiringManagerId: z.string().uuid(),
  hiringPriority: z.enum(HIRING_PRIORITIES),
  openings: z.coerce.number().int().min(1).max(500),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  experienceMin: z.coerce.number().min(0).max(60).optional(),
  experienceMax: z.coerce.number().min(0).max(60).optional(),
}).refine((data) => {
  if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
    return data.salaryMin <= data.salaryMax;
  }

  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salaryMax"],
}).refine((data) => {
  if (data.experienceMin !== undefined && data.experienceMax !== undefined) {
    return data.experienceMin <= data.experienceMax;
  }

  return true;
}, {
  message:
    "Maximum experience must be greater than or equal to minimum experience",
  path: ["experienceMax"],
});

export const updateRequisitionSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    skills: z.string().trim().max(2000).nullable().optional(),
    departmentId: z.string().uuid().optional(),
    hiringManagerId: z.string().uuid().optional(),
    hiringPriority: z.enum(HIRING_PRIORITIES).optional(),
    openings: z.coerce.number().int().min(1).max(500).optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    workMode: z.enum(WORK_MODES).optional(),
    salaryMin: z.coerce.number().int().min(0).nullable().optional(),
    salaryMax: z.coerce.number().int().min(0).nullable().optional(),
    experienceMin: z.coerce.number().min(0).max(60).nullable().optional(),
    experienceMax: z.coerce.number().min(0).max(60).nullable().optional(),
  })
  .refine((data) => {
    if (
      data.salaryMin !== undefined &&
      data.salaryMax !== undefined &&
      data.salaryMin !== null &&
      data.salaryMax !== null
    ) {
      return data.salaryMin <= data.salaryMax;
    }

    return true;
  }, {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryMax"],
  })
  .refine((data) => {
    if (
      data.experienceMin !== undefined &&
      data.experienceMax !== undefined &&
      data.experienceMin !== null &&
      data.experienceMax !== null
    ) {
      return data.experienceMin <= data.experienceMax;
    }

    return true;
  }, {
    message:
      "Maximum experience must be greater than or equal to minimum experience",
    path: ["experienceMax"],
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const rejectRequisitionSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const closeRequisitionSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const listRequisitionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(REQUISITION_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  hiringPriority: z.enum(HIRING_PRIORITIES).optional(),
  departmentId: z.string().uuid().optional(),
  workMode: z.enum(WORK_MODES).optional(),
});

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type UpdateRequisitionInput = z.infer<typeof updateRequisitionSchema>;
export type RejectRequisitionInput = z.infer<typeof rejectRequisitionSchema>;
export type CloseRequisitionInput = z.infer<typeof closeRequisitionSchema>;
export type ListRequisitionsQuery = z.infer<typeof listRequisitionsQuerySchema>;
