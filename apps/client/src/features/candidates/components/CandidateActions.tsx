import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { CandidateDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { useAuth } from "../../auth/useAuth.js";
import { ApiClientError } from "../../../lib/api-client.js";
import {
  deleteCandidate,
  moveCandidateToScreening,
  rejectCandidate,
  shortlistCandidate,
} from "../api/candidates-api.js";
import {
  canDeleteCandidate,
  canEditCandidate,
  canMoveToScreening,
  canReject,
  canShortlist,
} from "../utils/permissions.js";

type CandidateActionsProps = {
  candidate: CandidateDto;
  onUpdated: (candidate: CandidateDto) => void;
  onDeleted?: () => void;
  onSuccess?: (message: string) => void;
};

export function CandidateActions({
  candidate,
  onUpdated,
  onDeleted,
  onSuccess,
}: CandidateActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const showEdit = canEditCandidate(user);
  const showDelete = canDeleteCandidate(user);
  const showMoveToScreening = canMoveToScreening(user, candidate);
  const showShortlist = canShortlist(user, candidate);
  const showReject = canReject(user, candidate);

  if (
    !showEdit &&
    !showDelete &&
    !showMoveToScreening &&
    !showShortlist &&
    !showReject
  ) {
    return null;
  }

  async function runAction(action: () => Promise<CandidateDto>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      onSuccess?.("Candidate updated successfully.");
      showToast("Candidate updated successfully.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Action failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    await runAction(() =>
      rejectCandidate(candidate.id, {
        reason: rejectionReason.trim(),
        comments: rejectionComments.trim() || undefined,
      }),
    );
    setIsRejecting(false);
    setRejectionReason("");
    setRejectionComments("");
  }

  return (
    <div className="card candidate-actions">
      <h2>Actions</h2>

      <div className="button-row">
        {showEdit ? (
          <Link
            className="btn btn--secondary"
            to={`/candidates/${candidate.id}/edit`}
          >
            Edit
          </Link>
        ) : null}

        {showMoveToScreening ? (
          <button
            className="btn btn--primary"
            type="button"
            disabled={submitting}
            onClick={() => {
              if (!window.confirm("Move this candidate to screening?")) {
                return;
              }
              void runAction(() => moveCandidateToScreening(candidate.id));
            }}
          >
            Move to screening
          </button>
        ) : null}

        {showShortlist ? (
          <button
            className="btn btn--primary"
            type="button"
            disabled={submitting}
            onClick={() => {
              if (!window.confirm("Shortlist this candidate?")) {
                return;
              }
              void runAction(() => shortlistCandidate(candidate.id));
            }}
          >
            Shortlist
          </button>
        ) : null}

        {showReject ? (
          <button
            className="btn btn--danger"
            type="button"
            disabled={submitting}
            onClick={() => {
              setError(null);
              setIsRejecting(true);
            }}
          >
            Reject
          </button>
        ) : null}

        {showDelete ? (
          <button
            className="btn btn--danger"
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (
                !window.confirm(
                  "Delete this candidate? This will hide them from the list.",
                )
              ) {
                return;
              }

              setSubmitting(true);
              setError(null);
              try {
                await deleteCandidate(candidate.id);
                onSuccess?.("Candidate deleted.");
                showToast("Candidate deleted.");
                onDeleted?.();
              } catch (err) {
                const message =
                  err instanceof ApiClientError ? err.message : "Delete failed";
                setError(message);
                showToast(message, "error");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Delete
          </button>
        ) : null}
      </div>

      {isRejecting ? (
        <form className="reason-form" onSubmit={handleReject}>
          <label className="form-field">
            <span className="form-field__label">Rejection reason</span>
            <input
              className="form-field__input"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={500}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Comments (optional)</span>
            <textarea
              className="form-field__textarea"
              value={rejectionComments}
              onChange={(event) => setRejectionComments(event.target.value)}
              rows={3}
              maxLength={2000}
            />
          </label>

          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setIsRejecting(false);
                setRejectionReason("");
                setRejectionComments("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button className="btn btn--danger" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm rejection"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
