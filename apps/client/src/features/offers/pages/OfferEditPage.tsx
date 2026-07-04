import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { OfferDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getOffer, updateOffer } from "../api/offers-api.js";
import { OfferForm, offerDtoToFormValues } from "../components/OfferForm.js";
import { canEditOffer } from "../utils/permissions.js";

export function OfferEditPage() {
  const { id } = useParams<{ id: string }>();
  const offerId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState<OfferDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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

  if (!canEditOffer(user, offer)) {
    return <Navigate to={`/offers/${offer.id}`} replace />;
  }

  return (
    <div className="offers-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/offers/${offer.id}`}>Offer</Link>
          </p>
          <h1>Edit offer</h1>
          <p className="page-header__subtitle">
            Update draft details before submitting for approval.
          </p>
        </div>
      </div>

      <OfferForm
        mode="edit"
        initialValues={offerDtoToFormValues(offer)}
        lockedCandidate={{
          id: offer.candidate.id,
          fullName: offer.candidate.fullName,
          email: offer.candidate.email,
        }}
        submitLabel="Save changes"
        onCancel={() => navigate(`/offers/${offer.id}`)}
        onSubmit={async (values) => {
          const updated = await updateOffer(offer.id, values);
          navigate(`/offers/${updated.id}`);
        }}
      />
    </div>
  );
}
