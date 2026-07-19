import type {
  ReportDepartmentsDto,
  ReportEmployeesDto,
  ReportExportFormat,
  ReportFilters,
  ReportFiltersInput,
  ReportFunnelDto,
  ReportInterviewsDto,
  ReportOffersDto,
  ReportOnboardingDto,
  ReportOverviewDto,
  ReportRecruitmentDto,
  ReportDataset,
} from "@roms/shared";
import { apiGet, downloadAuthenticatedFile } from "../../../lib/api-client.js";

function buildQuery(filters: ReportFiltersInput) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.requisitionId) params.set("requisitionId", filters.requisitionId);
  if (filters.search) params.set("search", filters.search);
  if (filters.interviewDateBasis) {
    params.set("interviewDateBasis", filters.interviewDateBasis);
  }
  if (filters.offerDateBasis) {
    params.set("offerDateBasis", filters.offerDateBasis);
  }
  if (filters.onboardingDateBasis) {
    params.set("onboardingDateBasis", filters.onboardingDateBasis);
  }
  return params.toString();
}

function pathWithFilters(path: string, filters: ReportFiltersInput) {
  const query = buildQuery(filters);
  return query ? `${path}?${query}` : path;
}

export function getReportOverview(filters: ReportFiltersInput) {
  return apiGet<ReportOverviewDto>(pathWithFilters("/reports/overview", filters));
}

export function getRecruitmentReport(filters: ReportFiltersInput) {
  return apiGet<ReportRecruitmentDto>(
    pathWithFilters("/reports/recruitment", filters),
  );
}

export function getFunnelReport(filters: ReportFiltersInput) {
  return apiGet<ReportFunnelDto>(pathWithFilters("/reports/funnel", filters));
}

export function getDepartmentsReport(filters: ReportFiltersInput) {
  return apiGet<ReportDepartmentsDto>(
    pathWithFilters("/reports/departments", filters),
  );
}

export function getInterviewsReport(filters: ReportFiltersInput) {
  return apiGet<ReportInterviewsDto>(
    pathWithFilters("/reports/interviews", filters),
  );
}

export function getOffersReport(filters: ReportFiltersInput) {
  return apiGet<ReportOffersDto>(pathWithFilters("/reports/offers", filters));
}

export function getOnboardingReport(filters: ReportFiltersInput) {
  return apiGet<ReportOnboardingDto>(
    pathWithFilters("/reports/onboarding", filters),
  );
}

export function getEmployeesReport(filters: ReportFiltersInput) {
  return apiGet<ReportEmployeesDto>(
    pathWithFilters("/reports/employees", filters),
  );
}

export function downloadReportExport(
  dataset: ReportDataset,
  format: ReportExportFormat,
  filters: ReportFiltersInput,
) {
  const params = new URLSearchParams(buildQuery(filters));
  params.set("format", format);
  const fileName = `roms-${dataset}-${filters.dateFrom ?? "from"}-${filters.dateTo ?? "to"}.${format}`;
  return downloadAuthenticatedFile(
    `/reports/export/${dataset}?${params.toString()}`,
    fileName,
  );
}

export type { ReportFilters };
