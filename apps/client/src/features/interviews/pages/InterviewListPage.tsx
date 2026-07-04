import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { InterviewRoundType, InterviewStatus } from "@roms/shared";
import {
  INTERVIEW_ROUND_TYPES,
  INTERVIEW_STATUSES,
} from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listInterviews } from "../api/interviews-api.js";
import { FeedbackProgressBadge } from "../components/FeedbackProgressBadge.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { formatInterviewRoundLabel } from "../utils/interview-labels.js";
import { canManageInterviews } from "../utils/permissions.js";

const STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

const ROUND_LABELS: Record<InterviewRoundType, string> = {
  HR: "HR",
  TECHNICAL: "Technical",
  MANAGERIAL: "Managerial",
  FINAL: "Final",
  CUSTOM: "Custom",
};

function formatUserNames(
  people: Array<{ firstName: string; lastName: string }>,
) {
  if (people.length === 0) {
    return "—";
  }

  return people.map((person) => `${person.firstName} ${person.lastName}`).join(", ");
}

export function InterviewListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const candidateFilter = searchParams.get("candidateId") ?? "";
  const requisitionFilter = searchParams.get("requisitionId") ?? "";

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listInterviews>>["items"]
  >([]);
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | "">("");
  const [roundFilter, setRoundFilter] = useState<InterviewRoundType | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusChips = useMemo(
    () => [
      { label: "All", status: "" as const },
      ...INTERVIEW_STATUSES.map((status) => ({
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
        const result = await listInterviews({
          page,
          limit: 20,
          status: statusFilter || undefined,
          roundType: roundFilter || undefined,
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
              : "Failed to load interviews";
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
  }, [
    page,
    statusFilter,
    roundFilter,
    search,
    candidateFilter,
    requisitionFilter,
  ]);

  return (
    <div className="interviews-page">
      <div className="page-header">
        <div>
          <h1>Interviews</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>

        {user && canManageInterviews(user) ? (
          <Link className="btn btn--primary" to="/interviews/new">
            Schedule interview
          </Link>
        ) : null}
      </div>

      {candidateFilter ? (
        <div className="page-notice">
          Showing interviews for one candidate.{" "}
          <Link to="/interviews">Clear filter</Link>
        </div>
      ) : null}

      {requisitionFilter ? (
        <div className="page-notice">
          Showing interviews for one requisition.{" "}
          <Link to="/interviews">Clear filter</Link>
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
                setStatusFilter(event.target.value as InterviewStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {INTERVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--inline">
            <span className="form-field__label">Round</span>
            <select
              className="form-field__input"
              value={roundFilter}
              onChange={(event) => {
                setPage(1);
                setRoundFilter(event.target.value as InterviewRoundType | "");
              }}
            >
              <option value="">All rounds</option>
              {INTERVIEW_ROUND_TYPES.map((roundType) => (
                <option key={roundType} value={roundType}>
                  {ROUND_LABELS[roundType]}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--inline form-field--grow">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Candidate, requisition, or interviewer"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <span className="badge badge--loading">Loading interviews…</span>
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <h2>No interviews found</h2>
          <p>Try adjusting filters or schedule a new interview.</p>
          {user && canManageInterviews(user) ? (
            <Link className="btn btn--primary" to="/interviews/new">
              Schedule interview
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Candidate</th>
                <th>Requisition</th>
                <th>Scheduled</th>
                <th>Interviewers</th>
                <th>Status</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {items.map((interview) => (
                <tr key={interview.id}>
                  <td>
                    <Link to={`/interviews/${interview.id}`}>
                      {formatInterviewRoundLabel(
                        interview.roundType,
                        interview.sequence,
                        interview.customRoundLabel,
                      )}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/candidates/${interview.candidate.id}`}>
                      {interview.candidate.fullName}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/requisitions/${interview.requisition.id}`}>
                      {interview.requisition.title}
                    </Link>
                  </td>
                  <td>{new Date(interview.scheduledAt).toLocaleString()}</td>
                  <td>{formatUserNames(interview.interviewers)}</td>
                  <td>
                    <StatusBadge status={interview.status} />
                  </td>
                  <td>
                    <FeedbackProgressBadge interview={interview} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 ? (
            <div className="pagination">
              <button
                className="btn btn--secondary"
                type="button"
                disabled={page <= 1}
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
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
