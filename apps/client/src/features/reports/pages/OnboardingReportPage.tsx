import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportOnboardingDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getOnboardingReport } from "../api/reports-api.js";
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

export function OnboardingReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportOnboardingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getOnboardingReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load onboarding report",
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
          <h1>Onboarding analytics</h1>
        </div>
        <ExportButtons dataset="onboarding" filters={filters} />
      </div>
      <ReportsNav current="/reports/onboarding" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Start → join (days)"
              value={formatNumber(data.avgDaysStartToJoin)}
            />
            <KpiCard
              label="Join → complete (days)"
              value={formatNumber(data.avgDaysJoinToComplete)}
            />
            <KpiCard
              label="Task completion"
              value={formatPercent(data.taskCompletionRate)}
            />
            <KpiCard
              label="Document readiness"
              value={formatPercent(data.documentReadinessRate)}
            />
            <KpiCard label="Cancel rate" value={formatPercent(data.cancelRate)} />
          </div>
          <div className="detail-grid" style={{ marginTop: "1rem" }}>
            <StatusBreakdown
              title="Cases by status"
              items={data.byStatus.map((item) => ({
                key: item.status,
                label: item.status.replaceAll("_", " "),
                count: item.count,
              }))}
            />
            <StatusBreakdown
              title="Top cancel reasons"
              items={data.topCancelReasons}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
