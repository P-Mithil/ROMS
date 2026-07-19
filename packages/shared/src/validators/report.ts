import { z } from "zod";
import {
  MAX_REPORT_RANGE_DAYS,
  REPORT_DATASETS,
  REPORT_EXPORT_FORMATS,
  REPORT_INTERVIEW_DATE_BASIS,
  REPORT_OFFER_DATE_BASIS,
  REPORT_ONBOARDING_DATE_BASIS,
} from "../constants/report.js";

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const dateStringSchema = z.string().date();

export const reportFiltersSchema = z
  .object({
    dateFrom: dateStringSchema.optional(),
    dateTo: dateStringSchema.optional(),
    departmentId: z.string().uuid().optional(),
    requisitionId: z.string().uuid().optional(),
    search: z.string().trim().max(200).optional(),
    interviewDateBasis: z.enum(REPORT_INTERVIEW_DATE_BASIS).optional(),
    offerDateBasis: z.enum(REPORT_OFFER_DATE_BASIS).optional(),
    onboardingDateBasis: z.enum(REPORT_ONBOARDING_DATE_BASIS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be on or before dateTo",
        path: ["dateFrom"],
      });
    }

    if (data.dateFrom && data.dateTo) {
      const days = daysBetween(data.dateFrom, data.dateTo);
      if (days > MAX_REPORT_RANGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days`,
          path: ["dateTo"],
        });
      }
    }
  });

export const reportExportQuerySchema = reportFiltersSchema.and(
  z.object({
    format: z.enum(REPORT_EXPORT_FORMATS).default("csv"),
  }),
);

export const reportExportParamsSchema = z.object({
  dataset: z.enum(REPORT_DATASETS),
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export type ReportExportQueryInput = z.infer<typeof reportExportQuerySchema>;
export type ReportExportParamsInput = z.infer<typeof reportExportParamsSchema>;
