import type { OnboardingProgressDto } from "@roms/shared";
import { calcOverallProgress } from "../utils/onboarding-labels.js";

type ProgressSummaryProps = {
  progress: OnboardingProgressDto;
  joinedAt?: string | null;
};

function ProgressBar({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress-item">
      <div className="progress-item__header">
        <span>{label}</span>
        <strong>
          {completed}/{total} ({percent}%)
        </strong>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ProgressSummary({ progress, joinedAt }: ProgressSummaryProps) {
  const overall = calcOverallProgress(progress);

  return (
    <div className="progress-summary">
      <div className="progress-summary__overall">
        <span className="progress-summary__label">Overall progress</span>
        <strong className="progress-summary__value">{overall}%</strong>
      </div>

      <ProgressBar
        label="Required tasks"
        completed={progress.tasksRequiredCompleted}
        total={progress.tasksRequiredTotal}
      />
      <ProgressBar
        label="Required documents"
        completed={progress.documentsReady}
        total={progress.documentsRequiredTotal}
      />

      <p className="meta-text">
        Tasks completed: {progress.tasksCompleted}/{progress.tasksTotal}
      </p>

      {joinedAt ? (
        <p className="meta-text progress-summary__joined">
          Joining confirmed on{" "}
          {new Date(joinedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      ) : (
        <p className="meta-text progress-summary__joined">
          Joining not yet confirmed
        </p>
      )}
    </div>
  );
}
