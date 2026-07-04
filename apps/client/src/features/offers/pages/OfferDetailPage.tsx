import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { JobRequisitionDto, OfferDto, OnboardingCaseDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { listOnboardingCases } from "../../onboarding/api/onboarding-api.js";
import { StatusBadge as OnboardingStatusBadge } from "../../onboarding/components/StatusBadge.js";
import { canAccessOnboarding } from "../../onboarding/utils/permissions.js";
import {
  calcOverallProgress,
} from "../../onboarding/utils/onboarding-labels.js";
import { getRequisition } from "../../requisitions/api/requisitions-api.js";
import { getOffer } from "../api/offers-api.js";
import { OfferActions } from "../components/OfferActions.js";
import { OfferPreview } from "../components/OfferPreview.js";
import { OfferTimeline } from "../components/OfferTimeline.js";
import { StatusBadge } from "../components/StatusBadge.js";
import {
  formatCurrency,
  formatOfferDate,
  formatOfferDateTime,
} from "../utils/offer-labels.js";

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const offerId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState<OfferDto | null>(null);
  const [requisition, setRequisition] = useState<JobRequisitionDto | null>(null);
  const [onboardingCase, setOnboardingCase] = useState<OnboardingCaseDto | null>(
    null,
  );
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId) {
      return;
    }

    const currentId = offerId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getOffer(currentId);
        if (!cancelled) {
          setOffer(data);
        }

        const requisitionData = await getRequisition(data.requisition.id);
        if (!cancelled) {
          setRequisition(requisitionData);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError ? err.message : "Failed to load offer";
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
  }, [offerId]);

  useEffect(() => {
    if (!offer || offer.status !== "ACCEPTED") {
      setOnboardingCase(null);
      return;
    }

    const currentOffer = offer;
    let cancelled = false;

    async function loadOnboarding() {
      setOnboardingLoading(true);
      try {
        const result = await listOnboardingCases({
          page: 1,
          limit: 10,
          candidateId: currentOffer.candidate.id,
        });
        if (!cancelled) {
          setOnboardingCase(
            result.items.find((item) => item.offer.id === currentOffer.id) ??
              null,
          );
        }
      } catch {
        if (!cancelled) {
          setOnboardingCase(null);
        }
      } finally {
        if (!cancelled) {
          setOnboardingLoading(false);
        }
      }
    }

    void loadOnboarding();

    return () => {
      cancelled = true;
    };
  }, [offer]);

  if (!offerId) {
    return <p className="form-error">Invalid offer id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading offer…</span>
      </div>
    );
  }

  if (error || !offer) {
    return <p className="form-error">{error ?? "Offer not found."}</p>;
  }

  const remainingPositions =
    requisition != null
      ? Math.max(requisition.openings - requisition.filledPositions, 0)
      : null;
  const canViewOnboarding = user ? canAccessOnboarding(user) : false;

  return (
    <div className="offers-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/offers">Offers</Link>
          </p>
          <h1>{offer.jobTitle}</h1>
          <div className="page-badges">
            <StatusBadge status={offer.status} />
          </div>
        </div>
        <div className="page-header__actions">
          <Link
            className="btn btn--secondary"
            to={`/candidates/${offer.candidate.id}`}
          >
            View candidate
          </Link>
          <Link
            className="btn btn--secondary"
            to={`/requisitions/${offer.requisition.id}`}
          >
            View requisition
          </Link>
          {canViewOnboarding && onboardingCase ? (
            <Link
              className="btn btn--secondary"
              to={`/onboarding/${onboardingCase.id}`}
            >
              View onboarding
            </Link>
          ) : null}
        </div>
      </div>

      {notice ? <div className="page-notice">{notice}</div> : null}

      {offer.status === "ACCEPTED" && requisition ? (
        <div className="page-notice">
          This offer has been accepted. Filled positions:{" "}
          <strong>{requisition.filledPositions}</strong> of{" "}
          <strong>{requisition.openings}</strong>
          {remainingPositions != null ? (
            <>
              {" "}
              · Remaining: <strong>{remainingPositions}</strong>
            </>
          ) : null}
        </div>
      ) : null}

      {offer.status === "ACCEPTED" && canViewOnboarding ? (
        <div className="card">
          <h2>Onboarding</h2>
          {onboardingLoading ? (
            <span className="badge badge--loading">Loading onboarding…</span>
          ) : onboardingCase ? (
            <>
              <p className="meta-text">
                {onboardingCase.status === "PENDING"
                  ? "A pending onboarding case is ready to start."
                  : `Onboarding is ${onboardingCase.status.replaceAll("_", " ").toLowerCase()}.`}
                {" "}
                Progress: {calcOverallProgress(onboardingCase.progress)}%
              </p>
              <div className="button-row">
                <Link
                  className="btn btn--primary"
                  to={`/onboarding/${onboardingCase.id}`}
                >
                  {onboardingCase.status === "PENDING"
                    ? "Start onboarding"
                    : "Open onboarding case"}
                </Link>
                {onboardingCase.employee ? (
                  <Link
                    className="btn btn--secondary"
                    to={`/employees/${onboardingCase.employee.id}`}
                  >
                    View employee
                  </Link>
                ) : null}
              </div>
              <OnboardingStatusBadge status={onboardingCase.status} />
            </>
          ) : (
            <p className="meta-text">
              No onboarding case found yet. It is created automatically when the
              offer is accepted.
            </p>
          )}
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <h2>Offer details</h2>
            <dl className="detail-list">
              <div>
                <dt>Candidate</dt>
                <dd>
                  <Link to={`/candidates/${offer.candidate.id}`}>
                    {offer.candidate.fullName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Requisition</dt>
                <dd>
                  <Link to={`/requisitions/${offer.requisition.id}`}>
                    {offer.requisition.title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Employment type</dt>
                <dd>{offer.employmentType.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Work mode</dt>
                <dd>{offer.workMode.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Base salary</dt>
                <dd>{formatCurrency(offer.baseSalary, offer.currency)}</dd>
              </div>
              <div>
                <dt>Joining date</dt>
                <dd>{formatOfferDate(offer.joiningDate)}</dd>
              </div>
              <div>
                <dt>Valid until</dt>
                <dd>{formatOfferDateTime(offer.validUntil)}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{formatUserName(offer.createdBy)}</dd>
              </div>
              {offer.approvedBy ? (
                <div>
                  <dt>Approved by</dt>
                  <dd>{formatUserName(offer.approvedBy)}</dd>
                </div>
              ) : null}
              {offer.extendedBy ? (
                <div>
                  <dt>Extended by</dt>
                  <dd>{formatUserName(offer.extendedBy)}</dd>
                </div>
              ) : null}
              {offer.approvalRejectionReason ? (
                <div>
                  <dt>Approval rejection reason</dt>
                  <dd>{offer.approvalRejectionReason}</dd>
                </div>
              ) : null}
              {offer.declineReason ? (
                <div>
                  <dt>Decline reason</dt>
                  <dd>{offer.declineReason}</dd>
                </div>
              ) : null}
              {offer.responseNotes ? (
                <div>
                  <dt>Response notes</dt>
                  <dd>{offer.responseNotes}</dd>
                </div>
              ) : null}
              {requisition ? (
                <>
                  <div>
                    <dt>Filled positions</dt>
                    <dd>{requisition.filledPositions}</dd>
                  </div>
                  <div>
                    <dt>Remaining positions</dt>
                    <dd>{remainingPositions}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>

          {offer.internalNotes ? (
            <div className="card">
              <h2>Internal notes</h2>
              <p>{offer.internalNotes}</p>
            </div>
          ) : null}

          <div className="card">
            <h2>Candidate preview</h2>
            <OfferPreview offer={offer} />
          </div>

          <div className="card">
            <h2>Timeline</h2>
            <OfferTimeline items={offer.timeline} />
          </div>
        </div>

        <OfferActions
          offer={offer}
          onUpdated={setOffer}
          onDeleted={() => navigate("/offers")}
          onSuccess={setNotice}
        />
      </div>
    </div>
  );
}
