import { useEffect, useState } from "react";
import type { ReportDepartmentsDto, ReportFiltersInput } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getDepartmentsReport } from "../api/reports-api.js";
import { ExportButtons } from "../components/ExportButtons.js";
import { ReportFiltersBar } from "../components/ReportFiltersBar.js";
import { ReportsNav } from "../components/ReportsNav.js";
import { defaultReportFilters, formatNumber } from "../utils/report-labels.js";

export function DepartmentsReportPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(defaultReportFilters);
  const [data, setData] = useState<ReportDepartmentsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDepartmentsReport(filters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load department report",
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
          <h1>Department reports</h1>
        </div>
        <ExportButtons dataset="departments" filters={filters} />
      </div>
      <ReportsNav current="/reports/departments" />
      <ReportFiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <span className="badge badge--loading">Loading…</span>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data ? (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Open reqs</th>
                <th>Openings</th>
                <th>Candidates</th>
                <th>Interviews</th>
                <th>Extended</th>
                <th>Accepted</th>
                <th>Joined</th>
                <th>Onboarded</th>
                <th>Avg days to join</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.departmentId}>
                  <td>
                    {row.departmentName}
                    {!row.isActive ? (
                      <span className="meta-text"> (inactive)</span>
                    ) : null}
                  </td>
                  <td>{row.openRequisitions}</td>
                  <td>{row.openings}</td>
                  <td>{row.candidates}</td>
                  <td>{row.interviews}</td>
                  <td>{row.offersExtended}</td>
                  <td>{row.offersAccepted}</td>
                  <td>{row.joined}</td>
                  <td>{row.onboarded}</td>
                  <td>{formatNumber(row.avgDaysToJoin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
