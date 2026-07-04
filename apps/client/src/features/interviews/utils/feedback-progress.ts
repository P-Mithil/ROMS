import type { InterviewDto } from "@roms/shared";

export type FeedbackProgress = {
  applicable: boolean;
  submitted: number;
  total: number;
  label: string | null;
  tone: "success" | "warning" | "muted" | null;
};

export function getFeedbackProgress(interview: InterviewDto): FeedbackProgress {
  if (interview.status !== "COMPLETED" && interview.status !== "NO_SHOW") {
    return {
      applicable: false,
      submitted: 0,
      total: 0,
      label: null,
      tone: null,
    };
  }

  const interviewerIds = new Set(
    interview.interviewers.map((person) => person.id),
  );
  const total = interviewerIds.size;

  if (total === 0) {
    return {
      applicable: false,
      submitted: 0,
      total: 0,
      label: null,
      tone: null,
    };
  }

  const submitted = interview.feedbackItems.filter((item) =>
    interviewerIds.has(item.createdBy.id),
  ).length;
  const pending = total - submitted;

  if (pending === 0) {
    return {
      applicable: true,
      submitted,
      total,
      label: "Complete",
      tone: "success",
    };
  }

  if (pending === 1) {
    return {
      applicable: true,
      submitted,
      total,
      label: "Waiting for 1 interviewer",
      tone: "warning",
    };
  }

  return {
    applicable: true,
    submitted,
    total,
    label: `Waiting for ${pending} interviewers`,
    tone: "warning",
  };
}
