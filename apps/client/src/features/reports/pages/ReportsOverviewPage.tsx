import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportOverviewDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { ReportsAiPanel } from "../../ai/components/ReportsAiPanel.js";
import { canUseAi } from "../../ai/utils/permissions.js";
import { getReportOverview } from "../api/reports-api.js";
import { ExportButtons } from "../components/ExportButtons.js";
import { FunnelChart } from "../components/FunnelChart.js";
import { KpiCard } from "../components/KpiCard.js";
import { ReportFiltersBar } from "../components/ReportFiltersBar.js";
import { ReportsNav } from "../components/ReportsNav.js";
import { StatusBreakdown } from "../components/StatusBreakdown.js";
import {
  defaultReportFilters,
  formatNumber,
  formatPercent,
} from "../utils/report-labels.js";

export function ReportsOverviewPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showAi = canUseAi(user);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getReportOverview(filters);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load overview",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
          <h1>Reports</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>
        <ExportButtons dataset="funnel" filters={filters} />
      </div>

      <ReportsNav current="/reports" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {showAi ? (
        <ReportsAiPanel
          filters={{
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            departmentId: filters.departmentId,
            requisitionId: filters.requisitionId,
          }}
        />
      ) : null}

      {loading ? (
        <span className="badge badge--loading">Loading overview…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Open requisitions"
              value={formatNumber(data.kpis.openRequisitions)}
            />
            <KpiCard
              label="Active candidates"
              value={formatNumber(data.kpis.activeCandidates)}
            />
            <KpiCard
              label="Interviews scheduled"
              value={formatNumber(data.kpis.interviewsScheduled)}
            />
            <KpiCard
              label="Offers pending"
              value={formatNumber(data.kpis.offersPendingResponse)}
            />
            <KpiCard
              label="Onboarding in progress"
              value={formatNumber(data.kpis.onboardingInProgress)}
            />
            <KpiCard
              label="Joined in period"
              value={formatNumber(data.kpis.employeesJoinedInPeriod)}
            />
            <KpiCard
              label="Offer accept rate"
              value={formatPercent(data.kpis.offerAcceptRate)}
            />
            <KpiCard
              label="Avg time to hire"
              value={
                data.kpis.avgTimeToHireDays == null
                  ? "—"
                  : `${data.kpis.avgTimeToHireDays} days`
              }
            />
          </div>

          <div className="detail-grid" style={{ marginTop: "1rem" }}>
            <FunnelChart stages={data.funnelSnapshot} />
            <div className="detail-column">
              <StatusBreakdown
                title="Recent activity"
                items={[
                  {
                    key: "interviews",
                    label: "Interviews completed",
                    count: data.recentActivity.interviewsCompleted,
                  },
                  {
                    key: "offers",
                    label: "Offers extended",
                    count: data.recentActivity.offersExtended,
                  },
                  {
                    key: "onboarding",
                    label: "Onboardings completed",
                    count: data.recentActivity.onboardingsCompleted,
                  },
                ]}
              />
              <StatusBreakdown
                title="Top departments"
                items={data.topDepartments.map((department) => ({
                  key: department.departmentId,
                  label: department.departmentName,
                  count:
                    department.openRequisitions + department.joined,
                }))}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
