import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CandidateStatus } from "@roms/shared";
import { CANDIDATE_STATUSES } from "@roms/shared";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { FilterPresetsBar } from "../../../components/ui/FilterPresetsBar.js";
import { Icon } from "../../../components/ui/Icon.js";
import { SkeletonList } from "../../../components/ui/Skeleton.js";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { downloadCsv } from "../../../lib/csv.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { CandidateComparePanel } from "../../ai/components/CandidateComparePanel.js";
import { canUseAi } from "../../ai/utils/permissions.js";
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

type CandidateFilters = {
  status: CandidateStatus | "";
  search: string;
};

export function CandidateListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const requisitionFilter = searchParams.get("requisitionId") ?? "";
  const showAi = canUseAi(user);

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
          setSelectedIds([]);
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

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function selectAllVisible() {
    setSelectedIds(items.map((item) => item.id));
  }

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  function exportSelected() {
    if (selectedItems.length === 0) {
      showToast("Select at least one candidate to export.", "error");
      return;
    }
    downloadCsv(
      `candidates-selected-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Email", "Phone", "Requisition", "Status", "Resume", "Applied"],
      selectedItems.map((item) => [
        item.fullName,
        item.email,
        item.phone,
        item.requisition.title,
        item.status,
        item.resume ? "Yes" : "No",
        new Date(item.createdAt).toLocaleDateString(),
      ]),
    );
    showToast(`Exported ${selectedItems.length} candidate(s).`);
  }

  async function copySelectedEmails() {
    if (selectedItems.length === 0) {
      showToast("Select at least one candidate.", "error");
      return;
    }
    await navigator.clipboard.writeText(
      selectedItems.map((item) => item.email).join("; "),
    );
    showToast("Emails copied.");
  }

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
            <Icon name="plus" /> Add candidate
          </Link>
        ) : null}
      </div>

      {requisitionFilter ? (
        <div className="page-notice">
          Showing candidates for one requisition.{" "}
          <Link to="/candidates">Clear filter</Link>
        </div>
      ) : null}

      <div className="status-chips" role="toolbar" aria-label="Status filters">
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
            <span className="form-field__label">
              <Icon name="search" /> Search
            </span>
            <input
              className="form-field__input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, phone, skills, company, or requisition"
              aria-label="Search candidates"
            />
          </label>
        </div>
      </div>

      <FilterPresetsBar<CandidateFilters>
        scope="candidates"
        currentFilters={{ status: statusFilter, search }}
        onApply={(filters) => {
          setPage(1);
          setStatusFilter(filters.status);
          setSearchInput(filters.search);
          setSearch(filters.search);
        }}
      />

      {selectedIds.length > 0 ? (
        <div className="bulk-bar" role="region" aria-label="Bulk actions">
          <span>
            {selectedIds.length} selected
          </span>
          <div className="button-row">
            <button className="btn btn--secondary" type="button" onClick={selectAllVisible}>
              Select page
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => void copySelectedEmails()}
            >
              Copy emails
            </button>
            <button className="btn btn--secondary" type="button" onClick={exportSelected}>
              <Icon name="download" /> Export CSV
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {showAi ? (
        <CandidateComparePanel
          selectedIds={selectedIds.slice(0, 3)}
          onClear={() => setSelectedIds([])}
        />
      ) : null}

      {loading ? (
        <SkeletonList rows={4} label="Loading candidates" />
      ) : error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="users"
          title="No candidates found"
          description={
            search || statusFilter || requisitionFilter
              ? "Try changing the status filter or broadening the search terms."
              : "Add a candidate to start tracking applications and resume coverage."
          }
          actionLabel={
            user && canCreateCandidate(user) ? "Add candidate" : undefined
          }
          actionTo="/candidates/new"
        />
      ) : (
        <div className="card table-card">
          <p className="meta-text" style={{ marginBottom: "0.75rem" }}>
            Select rows for bulk export/copy
            {showAi ? " or AI compare (first 3)." : "."}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    className="ai-compare-check"
                    type="checkbox"
                    checked={
                      items.length > 0 &&
                      items.every((item) => selectedIds.includes(item.id))
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        selectAllVisible();
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    aria-label="Select all candidates on this page"
                  />
                </th>
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
                    <input
                      className="ai-compare-check"
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label={`Select ${item.fullName}`}
                    />
                  </td>
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
