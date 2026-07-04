import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { OfferStatus } from "@roms/shared";
import { OFFER_STATUSES } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listOffers } from "../api/offers-api.js";
import { StatusBadge } from "../components/StatusBadge.js";
import {
  formatCurrency,
  formatOfferDate,
  formatOfferStatus,
} from "../utils/offer-labels.js";
import { canCreateOffer } from "../utils/permissions.js";

const SUMMARY_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "EXTENDED",
  "ACCEPTED",
  "DECLINED",
] as const satisfies readonly OfferStatus[];

type SummaryStatus = (typeof SUMMARY_STATUSES)[number];

export function OfferListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const candidateFilter = searchParams.get("candidateId") ?? "";
  const requisitionFilter = searchParams.get("requisitionId") ?? "";

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listOffers>>["items"]
  >([]);
  const [summary, setSummary] = useState<Record<SummaryStatus, number>>({
    DRAFT: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    EXTENDED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
  });
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "">("");
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
        label: formatOfferStatus(status),
        value: summary[status],
      })),
    [summary],
  );

  const statusChips = useMemo(
    () => [
      { label: "All", status: "" as const },
      ...OFFER_STATUSES.map((status) => ({
        label: formatOfferStatus(status),
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

    async function loadSummary() {
      try {
        const results = await Promise.all(
          SUMMARY_STATUSES.map((status) =>
            listOffers({
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
        const result = await listOffers({
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
            err instanceof ApiClientError ? err.message : "Failed to load offers";
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
    <div className="offers-page">
      <div className="page-header">
        <div>
          <h1>Offers</h1>
          <p className="page-header__subtitle">
            {user
              ? `Signed in as ${user.firstName} ${user.lastName} (${user.role})`
              : null}
          </p>
        </div>

        {user && canCreateOffer(user) ? (
          <Link className="btn btn--primary" to="/offers/new">
            Create offer
          </Link>
        ) : null}
      </div>

      {candidateFilter ? (
        <div className="page-notice">
          Showing offers for one candidate.{" "}
          <Link to="/offers">Clear filter</Link>
        </div>
      ) : null}

      {requisitionFilter ? (
        <div className="page-notice">
          Showing offers for one requisition.{" "}
          <Link to="/offers">Clear filter</Link>
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
                setStatusFilter(event.target.value as OfferStatus | "");
              }}
            >
              <option value="">All statuses</option>
              {OFFER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOfferStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field--search">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              type="search"
              placeholder="Candidate, job title, requisition…"
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
          <h2>No offers found</h2>
          <p>Adjust filters or create a new offer for a shortlisted candidate.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job title</th>
                <th>Requisition</th>
                <th>Salary</th>
                <th>Joining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((offer) => (
                <tr key={offer.id}>
                  <td>
                    <Link className="table-link" to={`/offers/${offer.id}`}>
                      {offer.candidate.fullName}
                    </Link>
                    <p className="table-subtext">{offer.candidate.email}</p>
                  </td>
                  <td>{offer.jobTitle}</td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/requisitions/${offer.requisition.id}`}
                    >
                      {offer.requisition.title}
                    </Link>
                  </td>
                  <td>{formatCurrency(offer.baseSalary, offer.currency)}</td>
                  <td>{formatOfferDate(offer.joiningDate)}</td>
                  <td>
                    <StatusBadge status={offer.status} />
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
