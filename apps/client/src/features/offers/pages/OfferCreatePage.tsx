import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type { CandidateStatus } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getCandidate } from "../../candidates/api/candidates-api.js";
import { createOffer } from "../api/offers-api.js";
import { OfferForm } from "../components/OfferForm.js";
import {
  canCreateOffer,
  canCreateOfferForCandidate,
} from "../utils/permissions.js";

export function OfferCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const candidateId = searchParams.get("candidateId") ?? "";
  const [lockedCandidate, setLockedCandidate] = useState<{
    id: string;
    fullName: string;
    email: string;
    status: CandidateStatus;
  } | null>(null);
  const [loadingCandidate, setLoadingCandidate] = useState(Boolean(candidateId));
  const [candidateError, setCandidateError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    let cancelled = false;

    async function loadCandidate() {
      setLoadingCandidate(true);
      setCandidateError(null);
      try {
        const candidate = await getCandidate(candidateId);
        if (!cancelled) {
          setLockedCandidate({
            id: candidate.id,
            fullName: candidate.fullName,
            email: candidate.email,
            status: candidate.status,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load candidate";
          setCandidateError(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingCandidate(false);
        }
      }
    }

    void loadCandidate();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (!user || !canCreateOffer(user)) {
    return <Navigate to="/offers" replace />;
  }

  if (!candidateId) {
    return (
      <div className="offers-page">
        <p className="form-error">
          Select a shortlisted candidate to create an offer.
        </p>
        <Link className="btn btn--secondary" to="/candidates">
          Browse candidates
        </Link>
      </div>
    );
  }

  if (loadingCandidate) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading candidate…</span>
      </div>
    );
  }

  if (candidateError) {
    return <p className="form-error">{candidateError}</p>;
  }

  if (
    lockedCandidate &&
    !canCreateOfferForCandidate(user, { status: lockedCandidate.status })
  ) {
    return (
      <div className="offers-page">
        <p className="form-error">
          Only shortlisted or selected candidates can receive offers.
        </p>
        <Link
          className="btn btn--secondary"
          to={`/candidates/${lockedCandidate.id}`}
        >
          Back to candidate
        </Link>
      </div>
    );
  }

  return (
    <div className="offers-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/offers">Offers</Link>
          </p>
          <h1>Create offer</h1>
          <p className="page-header__subtitle">
            Draft compensation and terms before submitting for approval.
          </p>
        </div>
      </div>

      <OfferForm
        mode="create"
        submitLabel="Create draft offer"
        lockedCandidate={
          lockedCandidate
            ? {
                id: lockedCandidate.id,
                fullName: lockedCandidate.fullName,
                email: lockedCandidate.email,
              }
            : undefined
        }
        onCancel={() =>
          navigate(
            lockedCandidate
              ? `/candidates/${lockedCandidate.id}`
              : "/offers",
          )
        }
        onSubmit={async (values) => {
          const offer = await createOffer(values as never);
          navigate(`/offers/${offer.id}`);
        }}
      />
    </div>
  );
}
