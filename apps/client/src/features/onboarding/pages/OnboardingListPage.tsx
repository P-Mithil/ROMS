import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { OnboardingCaseStatus } from "@roms/shared";
import { ONBOARDING_CASE_STATUSES } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listOnboardingCases } from "../api/onboarding-api.js";
import { StatusBadge } from "../components/StatusBadge.js";
import {
  calcOverallProgress,
  formatDate,
  formatOnboardingCaseStatus,
} from "../utils/onboarding-labels.js";
import { canAccessOnboarding } from "../utils/permissions.js";

const SUMMARY_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "JOINED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly OnboardingCaseStatus[];

type SummaryStatus = (typeof SUMMARY_STATUSES)[number];

export function OnboardingListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const candidateFilter = searchParams.get("candidateId") ?? "";
  const requisitionFilter = searchParams.get("requisitionId") ?? "";

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listOnboardingCases>>["items"]
  >([]);
  const [summary, setSummary] = useState<Record<SummaryStatus, number>>({
    PENDING: 0,
    IN_PROGRESS: 0,
    JOINED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [statusFilter, setStatusFilter] = useState<OnboardingCaseStatus | "">("");
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
        label: formatOnboardingCaseStatus(status),
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
            listOnboardingCases({
              page: 1,
              limit: 1,
              status,
              candidateId: candidateFilter || undefined,
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
  }, [candidateFilter, requisitionFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await listOnboardingCases({
          page,
          limit: 20,
          status: statusFilter || undefined,
          candidateId: candidateFilter || undefined,
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
              : "Failed to load onboarding cases";
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
  }, [page, statusFilter, search, candidateFilter, requisitionFilter]);

  return (
    <div className="onboarding-page">
      <div className="page-header">
        <div>
          <h1>Onboarding</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>
        {user && canAccessOnboarding(user) ? (
          <Link className="btn btn--secondary" to="/employees">
            View employees
          </Link>
        ) : null}
      </div>

      {candidateFilter ? (
        <div className="page-notice">
          Showing onboarding for one candidate.{" "}
          <Link to="/onboarding">Clear filter</Link>
        </div>
      ) : null}

      {requisitionFilter ? (
        <div className="page-notice">
          Showing onboarding for one requisition.{" "}
          <Link to="/onboarding">Clear filter</Link>
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
                setStatusFilter(event.target.value as OnboardingCaseStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {ONBOARDING_CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOnboardingCaseStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--search">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              type="search"
              placeholder="Candidate, role, employee code…"
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
          <h2>No onboarding cases found</h2>
          <p>Accepted offers automatically create pending onboarding cases.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Joining</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="table-link" to={`/onboarding/${item.id}`}>
                      {item.candidate.fullName}
                    </Link>
                    <p className="table-subtext">{item.candidate.email}</p>
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/requisitions/${item.requisition.id}`}
                    >
                      {item.offer.jobTitle}
                    </Link>
                  </td>
                  <td>{formatDate(item.offer.joiningDate)}</td>
                  <td>{calcOverallProgress(item.progress)}%</td>
                  <td>
                    <StatusBadge status={item.status} />
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
