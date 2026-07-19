import type {
  ReportDataset,
  ReportExportFormat,
  ReportFiltersInput,
} from "@roms/shared";
import { MAX_REPORT_EXPORT_ROWS } from "@roms/shared";
import ExcelJS from "exceljs";
import { prisma } from "../../db/prisma.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import { reportsRepository } from "./reports.repository.js";
import {
  candidateWhere,
  requisitionLinkFilter,
  resolveReportFilters,
} from "./reports.scope.js";

function escapeCsv(value: unknown): string {
  if (value == null) {
    return "";
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

async function toXlsx(headers: string[], rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export const reportsService = {
  overview(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.overview(actor, filters);
  },

  recruitment(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.recruitment(actor, filters);
  },

  funnel(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.funnel(actor, filters);
  },

  departments(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.departments(actor, filters);
  },

  interviews(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.interviews(actor, filters);
  },

  offers(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.offers(actor, filters);
  },

  onboarding(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.onboarding(actor, filters);
  },

  employees(input: ReportFiltersInput, actor: AuthenticatedUser) {
    const filters = resolveReportFilters(input);
    return reportsRepository.employees(actor, filters);
  },

  async export(
    dataset: ReportDataset,
    format: ReportExportFormat,
    input: ReportFiltersInput,
    actor: AuthenticatedUser,
  ) {
    const filters = resolveReportFilters(input);
    const reqFilter = requisitionLinkFilter(actor, filters);
    let headers: string[] = [];
    let rows: unknown[][] = [];
    let truncated = false;

    if (dataset === "funnel") {
      const data = await reportsRepository.funnel(actor, filters);
      headers = ["Stage", "Count", "Type"];
      rows = [
        ...data.stages.map((stage) => [stage.label, stage.count, "stage"]),
        ...data.exits.map((exit) => [exit.label, exit.count, "exit"]),
        ...data.conversions.map((item) => [
          item.label,
          item.rate ?? "",
          "conversion",
        ]),
      ];
    } else if (dataset === "departments") {
      const data = await reportsRepository.departments(actor, filters);
      headers = [
        "Department",
        "Active",
        "Open requisitions",
        "Openings",
        "Candidates",
        "Interviews",
        "Offers extended",
        "Offers accepted",
        "Joined",
        "Onboarded",
        "Avg days to join",
      ];
      rows = data.rows.map((row) => [
        row.departmentName,
        row.isActive ? "Yes" : "No",
        row.openRequisitions,
        row.openings,
        row.candidates,
        row.interviews,
        row.offersExtended,
        row.offersAccepted,
        row.joined,
        row.onboarded,
        row.avgDaysToJoin ?? "",
      ]);
    } else if (dataset === "candidates") {
      const items = await prisma.candidate.findMany({
        where: candidateWhere(actor, filters, { createdInRange: true }),
        orderBy: { createdAt: "desc" },
        take: MAX_REPORT_EXPORT_ROWS + 1,
        select: {
          fullName: true,
          email: true,
          phone: true,
          status: true,
          currentCompany: true,
          createdAt: true,
          requisition: { select: { title: true, department: { select: { name: true } } } },
        },
      });
      truncated = items.length > MAX_REPORT_EXPORT_ROWS;
      const limited = items.slice(0, MAX_REPORT_EXPORT_ROWS);
      headers = [
        "Name",
        "Email",
        "Phone",
        "Status",
        "Company",
        "Requisition",
        "Department",
        "Created at",
      ];
      rows = limited.map((item) => [
        item.fullName,
        item.email,
        item.phone,
        item.status,
        item.currentCompany ?? "",
        item.requisition.title,
        item.requisition.department.name,
        item.createdAt.toISOString(),
      ]);
    } else if (dataset === "interviews") {
      const dateField =
        filters.interviewDateBasis === "completedAt"
          ? "completedAt"
          : "scheduledAt";
      const items = await prisma.interview.findMany({
        where: {
          deletedAt: null,
          requisition: reqFilter,
          [dateField]: {
            gte: filters.dateFromDate,
            lte: filters.dateToDate,
          },
        },
        orderBy: { scheduledAt: "desc" },
        take: MAX_REPORT_EXPORT_ROWS + 1,
        select: {
          roundType: true,
          status: true,
          mode: true,
          scheduledAt: true,
          completedAt: true,
          candidate: { select: { fullName: true, email: true } },
          requisition: { select: { title: true } },
        },
      });
      truncated = items.length > MAX_REPORT_EXPORT_ROWS;
      const limited = items.slice(0, MAX_REPORT_EXPORT_ROWS);
      headers = [
        "Candidate",
        "Email",
        "Requisition",
        "Round",
        "Status",
        "Mode",
        "Scheduled at",
        "Completed at",
      ];
      rows = limited.map((item) => [
        item.candidate.fullName,
        item.candidate.email,
        item.requisition.title,
        item.roundType,
        item.status,
        item.mode,
        item.scheduledAt.toISOString(),
        item.completedAt?.toISOString() ?? "",
      ]);
    } else if (dataset === "offers") {
      const dateField = filters.offerDateBasis;
      const items = await prisma.offer.findMany({
        where: {
          deletedAt: null,
          requisition: reqFilter,
          [dateField]: {
            gte: filters.dateFromDate,
            lte: filters.dateToDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_REPORT_EXPORT_ROWS + 1,
        select: {
          jobTitle: true,
          status: true,
          baseSalary: true,
          currency: true,
          joiningDate: true,
          createdAt: true,
          candidate: { select: { fullName: true, email: true } },
          requisition: { select: { title: true } },
        },
      });
      truncated = items.length > MAX_REPORT_EXPORT_ROWS;
      const limited = items.slice(0, MAX_REPORT_EXPORT_ROWS);
      headers = [
        "Candidate",
        "Email",
        "Job title",
        "Requisition",
        "Status",
        "Salary",
        "Currency",
        "Joining date",
        "Created at",
      ];
      rows = limited.map((item) => [
        item.candidate.fullName,
        item.candidate.email,
        item.jobTitle,
        item.requisition.title,
        item.status,
        item.baseSalary,
        item.currency,
        item.joiningDate.toISOString().slice(0, 10),
        item.createdAt.toISOString(),
      ]);
    } else if (dataset === "onboarding") {
      const dateField = filters.onboardingDateBasis;
      const items = await prisma.onboardingCase.findMany({
        where: {
          requisition: reqFilter,
          [dateField]: {
            gte: filters.dateFromDate,
            lte: filters.dateToDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_REPORT_EXPORT_ROWS + 1,
        select: {
          status: true,
          startedAt: true,
          joinedAt: true,
          completedAt: true,
          cancelReason: true,
          candidate: { select: { fullName: true, email: true } },
          requisition: { select: { title: true } },
        },
      });
      truncated = items.length > MAX_REPORT_EXPORT_ROWS;
      const limited = items.slice(0, MAX_REPORT_EXPORT_ROWS);
      headers = [
        "Candidate",
        "Email",
        "Requisition",
        "Status",
        "Started at",
        "Joined at",
        "Completed at",
        "Cancel reason",
      ];
      rows = limited.map((item) => [
        item.candidate.fullName,
        item.candidate.email,
        item.requisition.title,
        item.status,
        item.startedAt?.toISOString() ?? "",
        item.joinedAt?.toISOString() ?? "",
        item.completedAt?.toISOString() ?? "",
        item.cancelReason ?? "",
      ]);
    } else {
      const items = await prisma.employee.findMany({
        where: {
          requisition: reqFilter,
          ...(filters.departmentId
            ? { departmentId: filters.departmentId }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: MAX_REPORT_EXPORT_ROWS + 1,
        select: {
          employeeCode: true,
          fullName: true,
          email: true,
          status: true,
          jobTitle: true,
          employmentType: true,
          workMode: true,
          actualJoiningDate: true,
          department: { select: { name: true } },
        },
      });
      truncated = items.length > MAX_REPORT_EXPORT_ROWS;
      const limited = items.slice(0, MAX_REPORT_EXPORT_ROWS);
      headers = [
        "Employee code",
        "Name",
        "Email",
        "Status",
        "Job title",
        "Department",
        "Employment type",
        "Work mode",
        "Actual joining date",
      ];
      rows = limited.map((item) => [
        item.employeeCode,
        item.fullName,
        item.email,
        item.status,
        item.jobTitle,
        item.department.name,
        item.employmentType,
        item.workMode,
        item.actualJoiningDate?.toISOString().slice(0, 10) ?? "",
      ]);
    }

    if (truncated) {
      headers = [`TRUNCATED_TO_${MAX_REPORT_EXPORT_ROWS}`, ...headers];
      rows = rows.map((row) => ["", ...row]);
    }

    const filename = `roms-${dataset}-${filters.dateFrom}-${filters.dateTo}.${format}`;

    if (format === "xlsx") {
      const buffer = await toXlsx(headers, rows);
      return {
        filename,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: buffer,
      };
    }

    return {
      filename,
      contentType: "text/csv; charset=utf-8",
      body: Buffer.from(toCsv(headers, rows), "utf8"),
    };
  },
};
