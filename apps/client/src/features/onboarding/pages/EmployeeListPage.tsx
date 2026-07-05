import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { EmployeeStatus } from "@roms/shared";
import { EMPLOYEE_STATUSES } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listEmployees } from "../api/employees-api.js";
import { EmployeeStatusBadge } from "../components/EmployeeStatusBadge.js";
import {
  formatDate,
  formatEmployeeStatus,
} from "../utils/onboarding-labels.js";
import { canAccessOnboarding } from "../utils/permissions.js";

const SUMMARY_STATUSES = [
  "ONBOARDING",
  "JOINED",
  "ACTIVE",
  "WITHDRAWN",
] as const satisfies readonly EmployeeStatus[];

type SummaryStatus = (typeof SUMMARY_STATUSES)[number];

export function EmployeeListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requisitionFilter = searchParams.get("requisitionId") ?? "";

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listEmployees>>["items"]
  >([]);
  const [summary, setSummary] = useState<Record<SummaryStatus, number>>({
    ONBOARDING: 0,
    JOINED: 0,
    ACTIVE: 0,
    WITHDRAWN: 0,
  });
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summaryCards = useMemo(
    () =>
      SUMMARY_STATUSES.map((status) => ({
        status,
        label: formatEmployeeStatus(status),
        value: summary[status],
      })),
    [summary],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const results = await Promise.all(
          SUMMARY_STATUSES.map((status) =>
            listEmployees({
              page: 1,
              limit: 1,
              status,
              requisitionId: requisitionFilter || undefined,
            }),
          ),
        );

        if (!cancelled) {
          setSummary(
            Object.fromEntries(
              SUMMARY_STATUSES.map((status, index) => [
                status,
                results[index]?.meta.total ?? 0,
              ]),
            ) as Record<SummaryStatus, number>,
          );
        }
      } catch {
        // Summary is non-blocking.
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [requisitionFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await listEmployees({
          page,
          limit: 20,
          status: statusFilter || undefined,
          requisitionId: requisitionFilter || undefined,
          search: search || undefined,
        });

        if (!cancelled) {
          setItems(result.items);
          setTotalPages(result.meta.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load employees";
          setError(message);
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
  }, [page, statusFilter, search, requisitionFilter]);

  return (
    <div className="onboarding-page">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>
        {user && canAccessOnboarding(user) ? (
          <Link className="btn btn--secondary" to="/onboarding">
            View onboarding
          </Link>
        ) : null}
      </div>

      {requisitionFilter ? (
        <div className="page-notice">
          Showing employees for one requisition.{" "}
          <Link to="/employees">Clear filter</Link>
        </div>
      ) : null}

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <button
            key={card.status}
            type="button"
            className={`card summary-card ${
              statusFilter === card.status ? "summary-card--active" : ""
            }`}
            onClick={() => {
              setPage(1);
              setStatusFilter(card.status);
            }}
          >
            <span className="summary-card__label">{card.label}</span>
            <strong className="summary-card__value">{card.value}</strong>
          </button>
        ))}
      </div>

      <div className="card filters-card">
        <div className="filters-row">
          <label className="form-field form-field--inline">
            <span className="form-field__label">Status</span>
            <select
              className="form-field__input"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as EmployeeStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {EMPLOYEE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatEmployeeStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--search">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              type="search"
              placeholder="Name, email, employee code…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="list-skeleton">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <h2>No employees found</h2>
          <p>Employees are created when onboarding is started for accepted offers.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <Link className="table-link" to={`/employees/${employee.id}`}>
                      {employee.fullName}
                    </Link>
                    <p className="table-subtext">{employee.email}</p>
                  </td>
                  <td>{employee.employeeCode}</td>
                  <td>{employee.jobTitle}</td>
                  <td>{employee.department.name}</td>
                  <td>{formatDate(employee.expectedJoiningDate)}</td>
                  <td>
                    <EmployeeStatusBadge status={employee.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="pagination">
          <button
            className="btn btn--secondary"
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span className="pagination__label">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn--secondary"
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
