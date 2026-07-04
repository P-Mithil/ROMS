import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  HiringPriority,
  JobRequisitionDto,
  RequisitionListSummary,
  RequisitionStatus,
  WorkMode,
} from "@roms/shared";
import {
  HIRING_PRIORITIES,
  REQUISITION_STATUSES,
  WORK_MODES,
} from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listDepartments } from "../api/lookups-api.js";
import { listRequisitions } from "../api/requisitions-api.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { canCreateRequisition } from "../utils/permissions.js";

const emptySummary: RequisitionListSummary = {
  total: 0,
  open: 0,
  pendingApproval: 0,
  closed: 0,
  totalOpenings: 0,
  totalCandidates: 0,
  totalShortlisted: 0,
};

export function RequisitionListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<JobRequisitionDto[]>([]);
  const [summary, setSummary] = useState<RequisitionListSummary>(emptySummary);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<HiringPriority | "">("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState<WorkMode | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listDepartments()
      .then(setDepartments)
      .catch(() => undefined);
  }, []);

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
        const result = await listRequisitions({
          page,
          limit: 20,
          status: statusFilter || undefined,
          hiringPriority: priorityFilter || undefined,
          departmentId: departmentFilter || undefined,
          workMode: workModeFilter || undefined,
          search: search || undefined,
        });

        if (!cancelled) {
          setItems(result.items);
          setTotalPages(result.meta.totalPages);
          setSummary(result.summary);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load requisitions";
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
  }, [page, statusFilter, priorityFilter, departmentFilter, workModeFilter, search]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Requisitions", value: summary.total, status: "" as const },
      { label: "Open", value: summary.open, status: "OPEN" as const },
      { label: "Candidate Count", value: summary.totalCandidates, status: "" as const },
      { label: "Shortlisted", value: summary.totalShortlisted, status: "" as const },
      { label: "Open Positions", value: summary.totalOpenings, status: "" as const },
      { label: "Filled Positions", value: 0, status: "" as const },
    ],
    [summary],
  );

  return (
    <div className="requisitions-page">
      <div className="page-header">
        <div>
          <h1>Job requisitions</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>

        {user && canCreateRequisition(user) ? (
          <Link className="btn btn--primary" to="/requisitions/new">
            New requisition
          </Link>
        ) : null}
      </div>

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <button
            key={card.label}
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
        <div className="filters-grid">
          <label className="form-field form-field--inline">
            <span className="form-field__label">Status</span>
            <select
              className="form-field__input"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as RequisitionStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {REQUISITION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--inline">
            <span className="form-field__label">Priority</span>
            <select
              className="form-field__input"
              value={priorityFilter}
              onChange={(event) => {
                setPage(1);
                setPriorityFilter(event.target.value as HiringPriority | "");
              }}
            >
              <option value="">All priorities</option>
              {HIRING_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--inline">
            <span className="form-field__label">Department</span>
            <select
              className="form-field__input"
              value={departmentFilter}
              onChange={(event) => {
                setPage(1);
                setDepartmentFilter(event.target.value);
              }}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--inline">
            <span className="form-field__label">Work mode</span>
            <select
              className="form-field__input"
              value={workModeFilter}
              onChange={(event) => {
                setPage(1);
                setWorkModeFilter(event.target.value as WorkMode | "");
              }}
            >
              <option value="">All work modes</option>
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replaceAll("_", " ")}
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
              placeholder="Search by title, skills, department, or hiring manager"
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
          <h2>No requisitions found</h2>
          <p>
            {search || statusFilter || priorityFilter || departmentFilter || workModeFilter
              ? "Try clearing one or more filters to broaden the results."
              : "Create your first requisition to start tracking hiring demand."}
          </p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Status</th>
                <th>Candidates</th>
                <th>Openings</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="table-link" to={`/requisitions/${item.id}`}>
                      {item.title}
                    </Link>
                    <div className="table-subtext">
                      {item.employmentType.replaceAll("_", " ")} /{" "}
                      {item.workMode.replaceAll("_", " ")}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge--priority badge--priority-${item.hiringPriority.toLowerCase()}`}>
                      {item.hiringPriority.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{item.department.name}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.candidateCount} total / {item.shortlistedCount} shortlisted
                  </td>
                  <td>
                    {item.openings} open / {item.filledPositions} filled
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
