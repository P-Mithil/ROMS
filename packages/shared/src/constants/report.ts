export const REPORT_DATASETS = [
  "funnel",
  "departments",
  "candidates",
  "interviews",
  "offers",
  "onboarding",
  "employees",
] as const;

export type ReportDataset = (typeof REPORT_DATASETS)[number];

export const REPORT_EXPORT_FORMATS = ["csv", "xlsx"] as const;

export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export const REPORT_DATE_PRESETS = [
  "LAST_30",
  "LAST_90",
  "LAST_180",
  "THIS_YEAR",
] as const;

export type ReportDatePreset = (typeof REPORT_DATE_PRESETS)[number];

export const REPORT_INTERVIEW_DATE_BASIS = [
  "scheduledAt",
  "completedAt",
] as const;

export type ReportInterviewDateBasis =
  (typeof REPORT_INTERVIEW_DATE_BASIS)[number];

export const REPORT_OFFER_DATE_BASIS = [
  "createdAt",
  "extendedAt",
  "respondedAt",
] as const;

export type ReportOfferDateBasis = (typeof REPORT_OFFER_DATE_BASIS)[number];

export const REPORT_ONBOARDING_DATE_BASIS = [
  "createdAt",
  "joinedAt",
] as const;

export type ReportOnboardingDateBasis =
  (typeof REPORT_ONBOARDING_DATE_BASIS)[number];

export const MAX_REPORT_RANGE_DAYS = 366;
export const MAX_REPORT_EXPORT_ROWS = 5000;
