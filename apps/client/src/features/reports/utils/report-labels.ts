import type { ReportDatePreset, ReportFiltersInput } from "@roms/shared";

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function defaultReportFilters(): ReportFiltersInput {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  return {
    dateFrom: formatDate(from),
    dateTo: formatDate(to),
  };
}

export function filtersFromPreset(preset: ReportDatePreset): ReportFiltersInput {
  const to = new Date();
  const from = new Date();

  if (preset === "LAST_30") {
    from.setDate(from.getDate() - 29);
  } else if (preset === "LAST_90") {
    from.setDate(from.getDate() - 89);
  } else if (preset === "LAST_180") {
    from.setDate(from.getDate() - 179);
  } else {
    from.setMonth(0, 1);
  }

  return {
    dateFrom: formatDate(from),
    dateTo: formatDate(to),
  };
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }
  return `${value}%`;
}

export function formatNumber(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN").format(value);
}
