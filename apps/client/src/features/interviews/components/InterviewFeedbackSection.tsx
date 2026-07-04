import type { InterviewDto } from "@roms/shared";
import { useAuth } from "../../auth/useAuth.js";
import { FeedbackProgressBadge } from "./FeedbackProgressBadge.js";
import { InterviewFeedbackForm } from "./InterviewFeedbackForm.js";
import { InterviewFeedbackList } from "./InterviewFeedbackList.js";
import { PanelSummaryEditor } from "./PanelSummaryEditor.js";
import {
  canEditPanelSummary,
  canSubmitFeedback,
  getMyFeedback,
} from "../utils/permissions.js";

type InterviewFeedbackSectionProps = {
  interview: InterviewDto;
  onUpdated: (interview: InterviewDto) => void;
};

export function InterviewFeedbackSection({
  interview,
  onUpdated,
}: InterviewFeedbackSectionProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const showFeedbackSection =
    interview.status === "COMPLETED" ||
    interview.status === "NO_SHOW" ||
    interview.feedbackItems.length > 0 ||
    interview.feedbackSummary;

  if (!showFeedbackSection) {
    return null;
  }

  const myFeedback = getMyFeedback(interview, user.id);
  const canSubmit = canSubmitFeedback(user, interview);
  const canEditSummary = canEditPanelSummary(user, interview);

  return (
    <div className="card" id="interview-feedback">
      <div className="card__header-row">
        <h2>Feedback</h2>
        <FeedbackProgressBadge interview={interview} />
      </div>

      {interview.status === "NO_SHOW" ? (
        <p className="meta-text">
          Candidate did not attend. Feedback is optional for this interview.
        </p>
      ) : null}

      {canEditSummary ? (
        <PanelSummaryEditor interview={interview} onUpdated={onUpdated} />
      ) : interview.feedbackSummary ? (
        <div className="panel-summary-readonly">
          <h3>Panel summary</h3>
          <p className="description-text">{interview.feedbackSummary}</p>
        </div>
      ) : null}

      <h3>Submitted feedback</h3>
      <InterviewFeedbackList items={interview.feedbackItems} />

      {canSubmit ? (
        <>
          <h3>{myFeedback ? "My feedback" : "Submit my feedback"}</h3>
          <InterviewFeedbackForm
            interviewId={interview.id}
            existingFeedback={myFeedback}
            onSubmitted={onUpdated}
          />
        </>
      ) : interview.status === "SCHEDULED" ? (
        <p className="meta-text">
          Feedback can be submitted after the interview is completed.
        </p>
      ) : null}
    </div>
  );
}
