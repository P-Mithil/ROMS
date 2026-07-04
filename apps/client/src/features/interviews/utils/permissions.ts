import type {
  AuthUser,
  CandidateDto,
  InterviewDto,
  InterviewFeedbackDto,
} from "@roms/shared";

export function canAccessInterviews(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER" ||
    user.role === "INTERVIEWER"
  );
}

export function canManageInterviews(user: AuthUser): boolean {
  return user.role === "HR_ADMIN" || user.role === "RECRUITER";
}

export function canCompleteInterview(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canScheduleForCandidate(
  user: AuthUser,
  candidate: Pick<CandidateDto, "status">,
): boolean {
  return canManageInterviews(user) && candidate.status === "SHORTLISTED";
}

export function canEditInterview(
  user: AuthUser,
  interview: Pick<InterviewDto, "status">,
): boolean {
  return (
    canManageInterviews(user) &&
    interview.status === "SCHEDULED"
  );
}

export function canCancelInterview(
  user: AuthUser,
  interview: Pick<InterviewDto, "status">,
): boolean {
  return canEditInterview(user, interview);
}

export function canDeleteInterview(
  user: AuthUser,
  interview: Pick<InterviewDto, "status">,
): boolean {
  return canEditInterview(user, interview);
}

export function canSubmitFeedback(
  user: AuthUser,
  interview: InterviewDto,
): boolean {
  if (interview.status !== "COMPLETED" && interview.status !== "NO_SHOW") {
    return false;
  }

  if (user.role === "INTERVIEWER") {
    return interview.interviewers.some((person) => person.id === user.id);
  }

  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canEditPanelSummary(
  user: AuthUser,
  interview: Pick<InterviewDto, "status">,
): boolean {
  return canManageInterviews(user) && interview.status === "COMPLETED";
}

export function getMyFeedback(
  interview: InterviewDto,
  userId: string,
): InterviewFeedbackDto | undefined {
  return interview.feedbackItems.find((item) => item.createdBy.id === userId);
}
