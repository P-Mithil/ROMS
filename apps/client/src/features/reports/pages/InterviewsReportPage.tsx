import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportInterviewsDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getInterviewsReport } from "../api/reports-api.js";
import { ExportButtons } from "../components/ExportButtons.js";
import { KpiCard } from "../components/KpiCard.js";
import { ReportFiltersBar } from "../components/ReportFiltersBar.js";
import { ReportsNav } from "../components/ReportsNav.js";
import { StatusBreakdown } from "../components/StatusBreakdown.js";
import {
  defaultReportFilters,
  formatNumber,
  formatPercent,
} from "../utils/report-labels.js";

export function InterviewsReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportInterviewsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getInterviewsReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load interview report",
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
          <h1>Interview analytics</h1>
        </div>
        <ExportButtons dataset="interviews" filters={filters} />
      </div>
      <ReportsNav current="/reports/interviews" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Completion rate"
              value={formatPercent(data.completionRate)}
            />
            <KpiCard label="No-show rate" value={formatPercent(data.noShowRate)} />
            <KpiCard
              label="Feedback coverage"
              value={formatPercent(data.feedbackCoverage)}
            />
            <KpiCard label="Avg rating" value={formatNumber(data.avgRating)} />
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
            <StatusBreakdown
              title="By round"
              items={data.byRoundType.map((item) => ({
                key: item.key,
                label: item.key.replaceAll("_", " "),
                count: item.count,
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
