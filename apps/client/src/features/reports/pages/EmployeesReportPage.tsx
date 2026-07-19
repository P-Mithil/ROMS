import { useEffect, useState } from "react";
import type { ReportEmployeesDto, ReportFiltersInput } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getEmployeesReport } from "../api/reports-api.js";
import { ExportButtons } from "../components/ExportButtons.js";
import { KpiCard } from "../components/KpiCard.js";
import { ReportFiltersBar } from "../components/ReportFiltersBar.js";
import { ReportsNav } from "../components/ReportsNav.js";
import { StatusBreakdown } from "../components/StatusBreakdown.js";
import {
  defaultReportFilters,
  formatNumber,
} from "../utils/report-labels.js";

export function EmployeesReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportEmployeesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getEmployeesReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load employee report",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Employee analytics</h1>
        </div>
        <ExportButtons dataset="employees" filters={filters} />
      </div>
      <ReportsNav current="/reports/employees" />
      <ReportFiltersBar value={filters} onChange={setFilters} showSearch />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Joins in period"
              value={formatNumber(data.joinsInPeriod)}
            />
            <KpiCard
              label="Withdrawals in period"
              value={formatNumber(data.withdrawalsInPeriod)}
            />
          </div>
          <div className="detail-grid" style={{ marginTop: "1rem" }}>
            <StatusBreakdown
              title="By status"
              items={data.byStatus.map((item) => ({
                key: item.status,
                label: item.status.replaceAll("_", " "),
                count: item.count,
              }))}
            />
            <StatusBreakdown title="By department" items={data.byDepartment} />
          </div>
        </>
      ) : null}
    </div>
  );
}
