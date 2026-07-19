import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportOffersDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getOffersReport } from "../api/reports-api.js";
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

export function OffersReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportOffersDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getOffersReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load offer report",
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
          <h1>Offer analytics</h1>
        </div>
        <ExportButtons dataset="offers" filters={filters} />
      </div>
      <ReportsNav current="/reports/offers" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <>
          <div className="summary-grid">
            <KpiCard
              label="Accept rate"
              value={formatPercent(data.acceptRate)}
            />
            <KpiCard
              label="Decline rate"
              value={formatPercent(data.declineRate)}
            />
            <KpiCard
              label="Avg approval days"
              value={formatNumber(data.avgApprovalDays)}
            />
            <KpiCard
              label="Avg response days"
              value={formatNumber(data.avgResponseDays)}
            />
            <KpiCard
              label="Pending approval"
              value={formatNumber(data.pipeline.pendingApproval)}
            />
            <KpiCard
              label="Awaiting response"
              value={formatNumber(data.pipeline.extendedAwaitingResponse)}
            />
          </div>
          <div className="detail-grid" style={{ marginTop: "1rem" }}>
            <StatusBreakdown
              title="Offers by status"
              items={data.byStatus.map((item) => ({
                key: item.status,
                label: item.status.replaceAll("_", " "),
                count: item.count,
              }))}
            />
            <div className="card">
              <h2>Avg salary by currency</h2>
              {data.avgSalaryByCurrency.length === 0 ? (
                <p className="meta-text">No salary data in range.</p>
              ) : (
                <ul className="plain-list">
                  {data.avgSalaryByCurrency.map((item) => (
                    <li key={item.currency}>
                      {item.currency}: {formatNumber(item.average)} ({item.count}{" "}
                      offers)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
