import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { OnboardingCaseDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import {
  cancelOnboarding,
  completeOnboarding,
  confirmJoining,
  startOnboarding,
} from "../api/onboarding-api.js";
import {
  canCancelOnboarding,
  canConfirmJoining,
  canFinalizeOnboarding,
  canStartOnboarding,
} from "../utils/permissions.js";

type OnboardingActionsProps = {
  onboardingCase: OnboardingCaseDto;
  onUpdated: (onboardingCase: OnboardingCaseDto) => void;
  onSuccess?: (message: string) => void;
};

type PanelMode = "none" | "start" | "confirm-joining" | "cancel";

export function OnboardingActions({
  onboardingCase,
  onUpdated,
  onSuccess,
}: OnboardingActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [panelMode, setPanelMode] = useState<PanelMode>("none");
  const [workEmail, setWorkEmail] = useState("");
  const [actualJoiningDate, setActualJoiningDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [joiningNotes, setJoiningNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const showStart = canStartOnboarding(user, onboardingCase);
  const showConfirmJoining = canConfirmJoining(user, onboardingCase);
  const showComplete = canFinalizeOnboarding(user, onboardingCase);
  const showCancel = canCancelOnboarding(user, onboardingCase);

  if (!showStart && !showConfirmJoining && !showComplete && !showCancel) {
    return null;
  }

  async function runAction(
    action: () => Promise<OnboardingCaseDto>,
    successMessage: string,
  ) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      setPanelMode("none");
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

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      () =>
        startOnboarding(onboardingCase.id, {
          workEmail: workEmail.trim() || undefined,
        }),
      "Onboarding started.",
    );
  }

  async function handleConfirmJoining(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      () =>
        confirmJoining(onboardingCase.id, {
          actualJoiningDate,
          notes: joiningNotes.trim() || undefined,
        }),
      "Joining confirmed.",
    );
  }

  async function handleCancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancelReason.trim()) {
      setError("A cancellation reason is required");
      return;
    }

    await runAction(
      () =>
        cancelOnboarding(onboardingCase.id, {
          reason: cancelReason.trim(),
        }),
      "Onboarding cancelled.",
    );
  }

  return (
    <div className="card">
      <h2>Actions</h2>
      {error ? <p className="form-error">{error}</p> : null}

      {panelMode === "start" ? (
        <form className="reason-form" onSubmit={handleStart}>
          <p className="meta-text">
            This will create the employee record and seed the default task and
            document checklists.
          </p>
          <label className="form-field">
            <span className="form-field__label">Work email (optional)</span>
            <input
              className="form-field__input"
              type="email"
              value={workEmail}
              onChange={(event) => setWorkEmail(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("none")}
            >
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Starting…" : "Start onboarding"}
            </button>
          </div>
        </form>
      ) : null}

      {panelMode === "confirm-joining" ? (
        <form className="reason-form" onSubmit={handleConfirmJoining}>
          <label className="form-field">
            <span className="form-field__label">Actual joining date</span>
            <input
              className="form-field__input"
              type="date"
              required
              value={actualJoiningDate}
              onChange={(event) => setActualJoiningDate(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Notes (optional)</span>
            <textarea
              className="form-field__textarea"
              rows={2}
              value={joiningNotes}
              onChange={(event) => setJoiningNotes(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("none")}
            >
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm joining"}
            </button>
          </div>
        </form>
      ) : null}

      {panelMode === "cancel" ? (
        <form className="reason-form" onSubmit={handleCancel}>
          <label className="form-field">
            <span className="form-field__label">Cancellation reason</span>
            <textarea
              className="form-field__textarea"
              rows={3}
              required
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("none")}
            >
              Back
            </button>
            <button className="btn btn--danger" type="submit" disabled={submitting}>
              {submitting ? "Cancelling…" : "Confirm cancel"}
            </button>
          </div>
        </form>
      ) : null}

      {panelMode === "none" ? (
        <div className="button-row">
          {showStart ? (
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("start")}
            >
              Start onboarding
            </button>
          ) : null}
          {showConfirmJoining ? (
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("confirm-joining")}
            >
              Confirm joining
            </button>
          ) : null}
          {showComplete ? (
            <button
              className="btn btn--primary"
              type="button"
              disabled={submitting}
              onClick={() =>
                void runAction(
                  () => completeOnboarding(onboardingCase.id),
                  "Onboarding completed.",
                )
              }
            >
              Complete onboarding
            </button>
          ) : null}
          {onboardingCase.employee ? (
            <Link
              className="btn btn--secondary"
              to={`/employees/${onboardingCase.employee.id}`}
            >
              View employee
            </Link>
          ) : null}
          {showCancel ? (
            <button
              className="btn btn--danger"
              type="button"
              disabled={submitting}
              onClick={() => setPanelMode("cancel")}
            >
              Cancel onboarding
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
