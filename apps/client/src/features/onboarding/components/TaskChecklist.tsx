import { FormEvent, useState } from "react";
import type { OnboardingCaseDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import {
  completeOnboardingTask,
  skipOnboardingTask,
} from "../api/onboarding-api.js";
import {
  ONBOARDING_TASK_OWNER_LABELS,
  ONBOARDING_TASK_STATUS_LABELS,
} from "../utils/onboarding-labels.js";
import {
  canCompleteTask,
  canSkipTask,
} from "../utils/permissions.js";

type TaskChecklistProps = {
  onboardingCase: OnboardingCaseDto;
  hiringManagerId: string;
  onUpdated: (onboardingCase: OnboardingCaseDto) => void;
};

export function TaskChecklist({
  onboardingCase,
  hiringManagerId,
  onUpdated,
}: TaskChecklistProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const currentUser = user;

  const preJoining = onboardingCase.tasks.filter(
    (task) => task.phase === "PRE_JOINING",
  );
  const postJoining = onboardingCase.tasks.filter(
    (task) => task.phase === "POST_JOINING",
  );

  async function runAction(action: () => Promise<OnboardingCaseDto>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      showToast("Task updated.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Task action failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!skipTaskId || !skipReason.trim()) {
      setError("A skip reason is required");
      return;
    }

    await runAction(() =>
      skipOnboardingTask(onboardingCase.id, skipTaskId, {
        reason: skipReason.trim(),
      }),
    );
    setSkipTaskId(null);
    setSkipReason("");
  }

  function renderTaskSection(title: string, tasks: typeof onboardingCase.tasks) {
    return (
      <div className="checklist-section">
        <h3>{title}</h3>
        <ul className="checklist">
          {tasks.map((task) => {
            const showComplete = canCompleteTask(
              currentUser,
              task,
              onboardingCase,
              hiringManagerId,
            );
            const showSkip = canSkipTask(currentUser, task, onboardingCase);

            return (
              <li key={task.id} className="checklist__item">
                <div className="checklist__main">
                  <div>
                    <strong>{task.title}</strong>
                    <p className="meta-text">
                      {ONBOARDING_TASK_OWNER_LABELS[task.ownerRole]}
                      {task.isRequired ? " · Required" : " · Optional"}
                    </p>
                    {task.description ? (
                      <p className="meta-text">{task.description}</p>
                    ) : null}
                    {task.skipReason ? (
                      <p className="meta-text">Skipped: {task.skipReason}</p>
                    ) : null}
                  </div>
                  <span
                    className={`badge badge--status badge--task-${task.status.toLowerCase()}`}
                  >
                    {ONBOARDING_TASK_STATUS_LABELS[task.status]}
                  </span>
                </div>

                {showComplete || showSkip ? (
                  <div className="button-row">
                    {showComplete ? (
                      <button
                        className="btn btn--secondary"
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          void runAction(() =>
                            completeOnboardingTask(onboardingCase.id, task.id),
                          )
                        }
                      >
                        Mark complete
                      </button>
                    ) : null}
                    {showSkip ? (
                      <button
                        className="btn btn--ghost"
                        type="button"
                        disabled={submitting}
                        onClick={() => setSkipTaskId(task.id)}
                      >
                        Skip
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {task.phase === "POST_JOINING" &&
                onboardingCase.status !== "JOINED" &&
                onboardingCase.status !== "COMPLETED" ? (
                  <p className="meta-text">
                    Available after joining is confirmed
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Task checklist</h2>
      {error ? <p className="form-error">{error}</p> : null}

      {skipTaskId ? (
        <form className="reason-form" onSubmit={handleSkip}>
          <label className="form-field">
            <span className="form-field__label">Skip reason</span>
            <textarea
              className="form-field__textarea"
              rows={3}
              required
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setSkipTaskId(null);
                setSkipReason("");
              }}
            >
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm skip"}
            </button>
          </div>
        </form>
      ) : null}

      {renderTaskSection("Pre-joining", preJoining)}
      {renderTaskSection("Post-joining", postJoining)}
    </div>
  );
}
