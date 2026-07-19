import { useEffect, useState } from "react";
import type { ReportFiltersInput, ReportFunnelDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getFunnelReport } from "../api/reports-api.js";
import { ExportButtons } from "../components/ExportButtons.js";
import { FunnelChart } from "../components/FunnelChart.js";
import { ReportFiltersBar } from "../components/ReportFiltersBar.js";
import { ReportsNav } from "../components/ReportsNav.js";
import { StatusBreakdown } from "../components/StatusBreakdown.js";
import { defaultReportFilters, formatPercent } from "../utils/report-labels.js";

export function FunnelReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportFunnelDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getFunnelReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load funnel report",
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
          <h1>Hiring funnel</h1>
        </div>
        <ExportButtons dataset="funnel" filters={filters} />
      </div>
      <ReportsNav current="/reports/funnel" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <div className="detail-grid" style={{ marginTop: "1rem" }}>
          <FunnelChart stages={data.stages} />
          <div className="detail-column">
            <StatusBreakdown title="Exits" items={data.exits} />
            <div className="card">
              <h2>Conversions</h2>
              <ul className="plain-list">
                {data.conversions.map((item) => (
                  <li key={item.key}>
                    <strong>{item.label}</strong>: {item.numerator}/
                    {item.denominator} ({formatPercent(item.rate)})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
