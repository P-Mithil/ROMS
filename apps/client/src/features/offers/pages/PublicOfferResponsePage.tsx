import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicOfferDto } from "@roms/shared";
import { publicDeclineOfferSchema } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import {
  acceptPublicOffer,
  declinePublicOffer,
  getPublicOffer,
} from "../api/public-offers-api.js";
import { OfferPreview } from "../components/OfferPreview.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { formatOfferDateTime } from "../utils/offer-labels.js";

export function PublicOfferResponsePage() {
  const { token } = useParams<{ token: string }>();
  const responseToken = token ?? "";
  const [offer, setOffer] = useState<PublicOfferDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<"accepted" | "declined" | null>(
    null,
  );

  useEffect(() => {
    if (!responseToken) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublicOffer(responseToken);
        if (!cancelled) {
          setOffer(data);
          if (data.status === "ACCEPTED") {
            setCompleted("accepted");
          } else if (data.status === "DECLINED") {
            setCompleted("declined");
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "This offer link is invalid or unavailable.";
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
  }, [responseToken]);

  async function handleAccept() {
    if (!responseToken) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await acceptPublicOffer(responseToken);
      setOffer(updated);
      setCompleted("accepted");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to accept offer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!responseToken) {
      return;
    }

    const parsed = publicDeclineOfferSchema.safeParse({ reason: reason.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "A decline reason is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await declinePublicOffer(responseToken, parsed.data);
      setOffer(updated);
      setCompleted("declined");
      setShowDeclineForm(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to decline offer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!responseToken) {
    return (
      <div className="login-page">
        <div className="card login-card">
          <p className="form-error">Invalid offer link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="card login-card">
          <span className="badge badge--loading">Loading offer…</span>
        </div>
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="login-page">
        <div className="card login-card">
          <h1>Offer unavailable</h1>
          <p className="form-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const canRespond = offer.status === "EXTENDED" && !completed;

  return (
    <div className="login-page">
      <div className="card login-card public-offer-card">
        <div className="card__header-row">
          <div>
            <h1>Job offer</h1>
            <p className="login-card__subtitle">{offer.requisitionTitle}</p>
          </div>
          <StatusBadge status={offer.status} />
        </div>

        <p className="meta-text">
          Valid until {formatOfferDateTime(offer.validUntil)}
        </p>

        <OfferPreview offer={offer} />

        {completed === "accepted" ? (
          <div className="page-notice">
            Thank you. Your acceptance has been recorded.
          </div>
        ) : null}

        {completed === "declined" ? (
          <div className="page-notice">
            Your response has been recorded. Thank you for letting us know.
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        {canRespond ? (
          <>
            {!showDeclineForm ? (
              <div className="button-row">
                <button
                  className="btn btn--primary"
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleAccept()}
                >
                  {submitting ? "Submitting…" : "Accept offer"}
                </button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowDeclineForm(true)}
                >
                  Decline offer
                </button>
              </div>
            ) : (
              <form className="form" onSubmit={handleDecline}>
                <label className="form-field">
                  <span className="form-field__label">
                    Please share your reason for declining
                  </span>
                  <textarea
                    className="form-field__textarea"
                    rows={4}
                    required
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <div className="button-row">
                  <button
                    className="btn btn--secondary"
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setShowDeclineForm(false);
                      setReason("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--danger"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Confirm decline"}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
