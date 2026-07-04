import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CandidateStatus } from "@roms/shared";
import { CANDIDATE_STATUSES } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listCandidates } from "../api/candidates-api.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { canCreateCandidate } from "../utils/permissions.js";

const STATUS_LABELS: Record<CandidateStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  OFFER_ACCEPTED: "Offer accepted",
  JOINED: "Joined",
  ONBOARDED: "Onboarded",
  WITHDRAWN: "Withdrawn",
  OFFER_DECLINED: "Offer declined",
  REJECTED: "Rejected",
};

export function CandidateListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requisitionFilter = searchParams.get("requisitionId") ?? "";

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listCandidates>>["items"]
  >([]);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusChips = useMemo(
    () => [
      { label: "All", status: "" as const },
      ...CANDIDATE_STATUSES.map((status) => ({
        label: STATUS_LABELS[status],
        status,
      })),
    ],
    [],
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

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await listCandidates({
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
              : "Failed to load candidates";
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
    <div className="candidates-page">
      <div className="page-header">
        <div>
          <h1>Candidates</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>

        {user && canCreateCandidate(user) ? (
          <Link className="btn btn--primary" to="/candidates/new">
            Add candidate
          </Link>
        ) : null}
      </div>

      {requisitionFilter ? (
        <div className="page-notice">
          Showing candidates for one requisition.{" "}
          <Link to="/candidates">Clear filter</Link>
        </div>
      ) : null}

      <div className="status-chips">
        {statusChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className={`btn btn--chip ${
              statusFilter === chip.status ? "btn--chip-active" : ""
            }`}
            onClick={() => {
              setPage(1);
              setStatusFilter(chip.status);
            }}
          >
            {chip.label}
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
                setStatusFilter(event.target.value as CandidateStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {CANDIDATE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--search">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, phone, skills, company, or requisition"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="list-skeleton">
          <div className="card skeleton-card" />
          <div className="card skeleton-card" />
          <div className="card skeleton-card" />
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <h2>No candidates found</h2>
          <p>
            {search || statusFilter || requisitionFilter
              ? "Try changing the status filter or broadening the search terms."
              : "Add a candidate to start tracking applications and resume coverage."}
          </p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Requisition</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="table-link" to={`/candidates/${item.id}`}>
                      {item.fullName}
                    </Link>
                  </td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/requisitions/${item.requisition.id}`}
                    >
                      {item.requisition.title}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.resume ? (
                      <span className="badge badge--success">Uploaded</span>
                    ) : (
                      <span className="badge badge--warning">Missing</span>
                    )}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
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
