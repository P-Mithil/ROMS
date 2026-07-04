import type { InterviewDto } from "@roms/shared";
import { getFeedbackProgress } from "../utils/feedback-progress.js";

type FeedbackProgressBadgeProps = {
  interview: InterviewDto;
};

export function FeedbackProgressBadge({ interview }: FeedbackProgressBadgeProps) {
  const progress = getFeedbackProgress(interview);

  if (!progress.applicable || !progress.label) {
    return null;
  }

  return (
    <span
      className={`badge badge--feedback badge--feedback-${progress.tone}`}
      title={`${progress.submitted} of ${progress.total} interviewers submitted feedback`}
    >
      {progress.label}
    </span>
  );
}
