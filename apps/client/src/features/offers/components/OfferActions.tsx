import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { OfferDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import {
  approveOffer,
  deleteOffer,
  extendOffer,
  recordOfferAcceptance,
  recordOfferDecline,
  rejectOfferApproval,
  submitOffer,
  withdrawOffer,
} from "../api/offers-api.js";
import { buildPublicOfferUrl } from "../utils/offer-labels.js";
import {
  canApproveOffer,
  canDeleteOffer,
  canEditOffer,
  canExtendOffer,
  canRecordOfferResponse,
  canSubmitOffer,
  canWithdrawOffer,
} from "../utils/permissions.js";
import { OfferPreview } from "./OfferPreview.js";

type OfferActionsProps = {
  offer: OfferDto;
  onUpdated: (offer: OfferDto) => void;
  onDeleted?: () => void;
  onSuccess?: (message: string) => void;
};

type ReasonAction = "reject-approval" | "withdraw" | "record-decline" | null;
type PanelMode = "none" | "preview-extend" | "extend-result" | "record-acceptance";

export function OfferActions({
  offer,
  onUpdated,
  onDeleted,
  onSuccess,
}: OfferActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeAction, setActiveAction] = useState<ReasonAction>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("none");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [responseToken, setResponseToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const showEdit = canEditOffer(user, offer);
  const showDelete = canDeleteOffer(user, offer);
  const showSubmit = canSubmitOffer(user, offer);
  const showApproveReject = canApproveOffer(user, offer);
  const showExtend = canExtendOffer(user, offer);
  const showWithdraw = canWithdrawOffer(user, offer);
  const showRecordResponse = canRecordOfferResponse(user, offer);

  if (
    !showEdit &&
    !showDelete &&
    !showSubmit &&
    !showApproveReject &&
    !showExtend &&
    !showWithdraw &&
    !showRecordResponse
  ) {
    return null;
  }

  async function runAction(
    action: () => Promise<OfferDto>,
    successMessage: string,
  ) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      setActiveAction(null);
      setReason("");
      setNotes("");
      onSuccess?.(successMessage);
      showToast(successMessage);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Action failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReasonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAction || !reason.trim()) {
      setError("A reason is required");
      return;
    }

    if (activeAction === "reject-approval") {
      await runAction(
        () => rejectOfferApproval(offer.id, { reason: reason.trim() }),
        "Offer approval rejected.",
      );
      return;
    }

    if (activeAction === "withdraw") {
      await runAction(
        () => withdrawOffer(offer.id, { reason: reason.trim() }),
        "Offer withdrawn.",
      );
      return;
    }

    await runAction(
      () =>
        recordOfferDecline(offer.id, {
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        }),
      "Offer decline recorded.",
    );
  }

  async function handleExtend() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await extendOffer(offer.id);
      onUpdated(result.offer);
      setResponseToken(result.responseToken);
      setPanelMode("extend-result");
      onSuccess?.("Offer extended to candidate.");
      showToast("Offer extended to candidate.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to extend offer";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordAcceptance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      () =>
        recordOfferAcceptance(offer.id, {
          notes: notes.trim() || undefined,
        }),
      "Offer acceptance recorded.",
    );
    setPanelMode("none");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this draft offer?")) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await deleteOffer(offer.id);
      showToast("Offer deleted.");
      onDeleted?.();
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to delete offer";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function copyResponseLink() {
    if (!responseToken) {
      return;
    }

    const url = buildPublicOfferUrl(responseToken);
    void navigator.clipboard.writeText(url);
    showToast("Response link copied.");
  }

  return (
    <div className="card">
      <h2>Actions</h2>

      {error ? <p className="form-error">{error}</p> : null}

      {panelMode === "preview-extend" ? (
        <div className="offer-action-panel">
          <OfferPreview offer={offer} />
          <p className="meta-text">
            Confirm to extend this offer and generate a secure candidate response
            link.
          </p>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("none")}
            >
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting}
              onClick={() => void handleExtend()}
            >
              {submitting ? "Extending…" : "Confirm & extend"}
            </button>
          </div>
        </div>
      ) : null}

      {panelMode === "extend-result" && responseToken ? (
        <div className="offer-action-panel">
          <p className="page-notice">
            Share this secure link with the candidate. It can be used once.
          </p>
          <label className="form-field">
            <span className="form-field__label">Candidate response link</span>
            <input
              className="form-field__input"
              readOnly
              value={buildPublicOfferUrl(responseToken)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={copyResponseLink}
            >
              Copy link
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => {
                setPanelMode("none");
                setResponseToken(null);
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {panelMode === "record-acceptance" ? (
        <form className="reason-form" onSubmit={handleRecordAcceptance}>
          <label className="form-field">
            <span className="form-field__label">Notes (optional)</span>
            <textarea
              className="form-field__textarea"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setPanelMode("none");
                setNotes("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Record acceptance"}
            </button>
          </div>
        </form>
      ) : null}

      {activeAction ? (
        <form className="reason-form" onSubmit={handleReasonSubmit}>
          <label className="form-field">
            <span className="form-field__label">
              {activeAction === "record-decline" ? "Decline reason" : "Reason"}
            </span>
            <textarea
              className="form-field__textarea"
              rows={3}
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {activeAction === "record-decline" ? (
            <label className="form-field">
              <span className="form-field__label">Notes (optional)</span>
              <textarea
                className="form-field__textarea"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          ) : null}
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setActiveAction(null);
                setReason("");
                setNotes("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      ) : (
        <div className="button-row">
          {showEdit ? (
            <Link className="btn btn--secondary" to={`/offers/${offer.id}/edit`}>
              Edit offer
            </Link>
          ) : null}

          {showSubmit ? (
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting || panelMode !== "none"}
              onClick={() =>
                void runAction(
                  () => submitOffer(offer.id),
                  "Offer submitted for approval.",
                )
              }
            >
              Submit for approval
            </button>
          ) : null}

          {showApproveReject ? (
            <>
              <button
                className="btn btn--primary"
                type="button"
                disabled={submitting || panelMode !== "none"}
                onClick={() =>
                  void runAction(
                    () => approveOffer(offer.id),
                    "Offer approved.",
                  )
                }
              >
                Approve
              </button>
              <button
                className="btn btn--danger"
                type="button"
                disabled={submitting || panelMode !== "none"}
                onClick={() => setActiveAction("reject-approval")}
              >
                Reject approval
              </button>
            </>
          ) : null}

          {showExtend ? (
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting || panelMode !== "none"}
              onClick={() => setPanelMode("preview-extend")}
            >
              Preview & extend
            </button>
          ) : null}

          {showRecordResponse ? (
            <>
              <button
                className="btn btn--primary"
                type="button"
                disabled={submitting || panelMode !== "none"}
                onClick={() => setPanelMode("record-acceptance")}
              >
                Record acceptance
              </button>
              <button
                className="btn btn--secondary"
                type="button"
                disabled={submitting || panelMode !== "none"}
                onClick={() => setActiveAction("record-decline")}
              >
                Record decline
              </button>
            </>
          ) : null}

          {showWithdraw ? (
            <button
              className="btn btn--danger"
              type="button"
              disabled={submitting || panelMode !== "none"}
              onClick={() => setActiveAction("withdraw")}
            >
              Withdraw
            </button>
          ) : null}

          {showDelete ? (
            <button
              className="btn btn--danger"
              type="button"
              disabled={submitting || panelMode !== "none"}
              onClick={() => void handleDelete()}
            >
              Delete draft
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
