import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { InterviewDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { useAuth } from "../../auth/useAuth.js";
import { ApiClientError } from "../../../lib/api-client.js";
import {
  cancelInterview,
  completeInterview,
  deleteInterview,
  markInterviewNoShow,
} from "../api/interviews-api.js";
import {
  canCancelInterview,
  canCompleteInterview,
  canDeleteInterview,
  canEditInterview,
} from "../utils/permissions.js";

type InterviewActionsProps = {
  interview: InterviewDto;
  onUpdated: (interview: InterviewDto) => void;
  onDeleted?: () => void;
  onSuccess?: (message: string) => void;
};

type ReasonAction = "cancel" | "no-show" | null;
type CompleteAction = "complete" | null;

export function InterviewActions({
  interview,
  onUpdated,
  onDeleted,
  onSuccess,
}: InterviewActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reasonAction, setReasonAction] = useState<ReasonAction>(null);
  const [completeAction, setCompleteAction] = useState<CompleteAction>(null);
  const [reason, setReason] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const showEdit = canEditInterview(user, interview);
  const showCancel = canCancelInterview(user, interview);
  const showComplete =
    canCompleteInterview(user) && interview.status === "SCHEDULED";
  const showNoShow =
    canCompleteInterview(user) && interview.status === "SCHEDULED";
  const showDelete = canDeleteInterview(user, interview);

  if (!showEdit && !showCancel && !showComplete && !showNoShow && !showDelete) {
    return null;
  }

  async function runAction(action: () => Promise<InterviewDto>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      setReasonAction(null);
      setCompleteAction(null);
      setReason("");
      setCompletionNotes("");
      onSuccess?.("Interview updated successfully.");
      showToast("Interview updated successfully.");
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
    if (!reasonAction || !reason.trim()) {
      setError("A reason is required");
      return;
    }

    if (reasonAction === "cancel") {
      await runAction(() =>
        cancelInterview(interview.id, { reason: reason.trim() }),
      );
      return;
    }

    await runAction(() =>
      markInterviewNoShow(interview.id, { reason: reason.trim() }),
    );
  }

  async function handleCompleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(() =>
      completeInterview(interview.id, {
        completionNotes: completionNotes.trim() || undefined,
      }),
    );
  }

  return (
    <div className="card requisition-actions">
      <h2>Actions</h2>

      <div className="button-row">
        {showEdit ? (
          <Link
            className="btn btn--secondary"
            to={`/interviews/${interview.id}/edit`}
          >
            Edit
          </Link>
        ) : null}

        {showComplete ? (
          <button
            className="btn btn--primary"
            type="button"
            disabled={submitting}
            onClick={() => {
              setCompleteAction("complete");
              setReasonAction(null);
              setError(null);
            }}
          >
            Mark completed
          </button>
        ) : null}

        {showNoShow ? (
          <button
            className="btn btn--secondary"
            type="button"
            disabled={submitting}
            onClick={() => {
              setReasonAction("no-show");
              setCompleteAction(null);
              setError(null);
            }}
          >
            Mark no-show
          </button>
        ) : null}

        {showCancel ? (
          <button
            className="btn btn--danger"
            type="button"
            disabled={submitting}
            onClick={() => {
              setReasonAction("cancel");
              setCompleteAction(null);
              setError(null);
            }}
          >
            Cancel interview
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
                  "Delete this scheduled interview? This cannot be undone.",
                )
              ) {
                return;
              }

              setSubmitting(true);
              setError(null);
              try {
                await deleteInterview(interview.id);
                onSuccess?.("Interview deleted.");
                showToast("Interview deleted.");
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

      {completeAction ? (
        <form className="reason-form" onSubmit={handleCompleteSubmit}>
          <label className="form-field">
            <span className="form-field__label">Completion notes (optional)</span>
            <textarea
              className="form-field__textarea"
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
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
                setCompleteAction(null);
                setCompletionNotes("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Confirm completion"}
            </button>
          </div>
        </form>
      ) : null}

      {reasonAction ? (
        <form className="reason-form" onSubmit={handleReasonSubmit}>
          <label className="form-field">
            <span className="form-field__label">
              {reasonAction === "cancel" ? "Cancellation reason" : "No-show reason"}
            </span>
            <textarea
              className="form-field__textarea"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              required
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setReasonAction(null);
                setReason("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn--danger"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
