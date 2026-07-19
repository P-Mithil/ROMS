import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportRecruitmentDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getRecruitmentReport } from "../api/reports-api.js";
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

export function RecruitmentReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportRecruitmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getRecruitmentReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load recruitment report",
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
          <h1>Recruitment analytics</h1>
        </div>
        <ExportButtons dataset="candidates" filters={filters} />
      </div>
      <ReportsNav current="/reports/recruitment" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Candidates in range"
              value={formatNumber(data.candidatesCreatedInRange)}
            />
            <KpiCard
              label="Openings"
              value={formatNumber(data.openingsVsFilled.totalOpenings)}
            />
            <KpiCard
              label="Filled (accepted offers)"
              value={formatNumber(data.openingsVsFilled.totalFilled)}
            />
            <KpiCard
              label="Rejection rate"
              value={formatPercent(data.rejectionRate)}
            />
            <KpiCard
              label="Withdrawal rate"
              value={formatPercent(data.withdrawalRate)}
            />
            <KpiCard
              label="Avg candidates / open req"
              value={formatNumber(data.avgCandidatesPerOpenRequisition)}
            />
          </div>
          <div className="detail-grid" style={{ marginTop: "1rem" }}>
            <StatusBreakdown
              title="Requisitions by status"
              items={data.requisitionsByStatus.map((item) => ({
                key: item.status,
                label: item.status.replaceAll("_", " "),
                count: item.count,
              }))}
            />
            <StatusBreakdown
              title="Candidates by status"
              items={data.candidatesByStatus.map((item) => ({
                key: item.status,
                label: item.status.replaceAll("_", " "),
                count: item.count,
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
