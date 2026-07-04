import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { JobRequisitionDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { useAuth } from "../../auth/useAuth.js";
import { ApiClientError } from "../../../lib/api-client.js";
import {
  approveRequisition,
  closeRequisition,
  deleteRequisition,
  rejectRequisition,
  submitRequisition,
} from "../api/requisitions-api.js";
import {
  canApproveOrReject,
  canCloseRequisition,
  canDeleteRequisition,
  canEditRequisition,
  canSubmitRequisition,
} from "../utils/permissions.js";

type RequisitionActionsProps = {
  requisition: JobRequisitionDto;
  onUpdated: (requisition: JobRequisitionDto) => void;
  onDeleted?: () => void;
  onSuccess?: (message: string) => void;
};

type ReasonAction = "reject" | "close" | null;

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function RequisitionActions({
  requisition,
  onUpdated,
  onDeleted,
  onSuccess,
}: RequisitionActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeAction, setActiveAction] = useState<ReasonAction>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const showSubmit = canSubmitRequisition(user, requisition);
  const showApproveReject = canApproveOrReject(user, requisition);
  const showClose = canCloseRequisition(user, requisition);
  const showEdit = canEditRequisition(user, requisition);
  const showDelete = canDeleteRequisition(user, requisition);

  if (!showSubmit && !showApproveReject && !showClose && !showEdit && !showDelete) {
    return null;
  }

  async function runAction(action: () => Promise<JobRequisitionDto>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      setActiveAction(null);
      setReason("");
      onSuccess?.("Requisition updated successfully.");
      showToast("Requisition updated successfully.");
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

    if (activeAction === "reject") {
      await runAction(() =>
        rejectRequisition(requisition.id, { reason: reason.trim() }),
      );
      return;
    }

    await runAction(() =>
      closeRequisition(requisition.id, { reason: reason.trim() }),
    );
  }

  return (
    <div className="card requisition-actions">
      <h2>Actions</h2>

      <div className="button-row">
        {showEdit ? (
          <Link
            className="btn btn--secondary"
            to={`/requisitions/${requisition.id}/edit`}
          >
            Edit
          </Link>
        ) : null}

        {showSubmit ? (
          <button
            className="btn btn--primary"
            type="button"
            disabled={submitting}
            onClick={() => {
              if (!window.confirm("Submit this requisition for approval?")) {
                return;
              }
              void runAction(() => submitRequisition(requisition.id));
            }}
          >
            Submit for approval
          </button>
        ) : null}

        {showApproveReject ? (
          <>
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting}
              onClick={() => {
                if (!window.confirm("Approve this requisition?")) {
                  return;
                }
                void runAction(() => approveRequisition(requisition.id));
              }}
            >
              Approve
            </button>
            <button
              className="btn btn--danger"
              type="button"
              disabled={submitting}
              onClick={() => {
                setActiveAction("reject");
                setError(null);
              }}
            >
              Reject
            </button>
          </>
        ) : null}

        {showClose ? (
          <button
            className="btn btn--secondary"
            type="button"
            disabled={submitting}
            onClick={() => {
              setActiveAction("close");
              setError(null);
            }}
          >
            Close
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
                  "Delete this draft requisition? This will hide it from the list.",
                )
              ) {
                return;
              }

              setSubmitting(true);
              setError(null);
              try {
                await deleteRequisition(requisition.id);
                onSuccess?.("Draft requisition deleted.");
                showToast("Draft requisition deleted.");
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

      {activeAction ? (
        <form className="reason-form" onSubmit={handleReasonSubmit}>
          <label className="form-field">
            <span className="form-field__label">
              {activeAction === "reject" ? "Rejection reason" : "Close reason"}
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
                setActiveAction(null);
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

      {requisition.approvedBy ? (
        <p className="meta-text">
          Approved by {formatUserName(requisition.approvedBy)}
          {requisition.approvedAt
            ? ` on ${new Date(requisition.approvedAt).toLocaleString()}`
            : ""}
        </p>
      ) : null}

      {requisition.rejectionReason ? (
        <p className="meta-text meta-text--danger">
          Rejected: {requisition.rejectionReason}
        </p>
      ) : null}

      {requisition.closeReason ? (
        <p className="meta-text">
          Closed: {requisition.closeReason}
        </p>
      ) : null}
    </div>
  );
}
