import type { AuthUser, CandidateDto } from "@roms/shared";

export function canAccessCandidates(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canCreateCandidate(user: AuthUser): boolean {
  return user.role === "HR_ADMIN" || user.role === "RECRUITER";
}

export function canEditCandidate(_user: AuthUser): boolean {
  return canCreateCandidate(_user);
}

export function canDeleteCandidate(user: AuthUser): boolean {
  return canCreateCandidate(user);
}

export function canChangeCandidateStatus(user: AuthUser): boolean {
  return canCreateCandidate(user);
}

export function canDownloadResume(user: AuthUser): boolean {
  return canAccessCandidates(user);
}

export function canMoveToScreening(
  user: AuthUser,
  candidate: CandidateDto,
): boolean {
  return (
    canChangeCandidateStatus(user) && candidate.status === "APPLIED"
  );
}

export function canShortlist(
  user: AuthUser,
  candidate: CandidateDto,
): boolean {
  return (
    canChangeCandidateStatus(user) && candidate.status === "SCREENING"
  );
}

export function canReject(
  user: AuthUser,
  candidate: CandidateDto,
): boolean {
  return (
    canChangeCandidateStatus(user) &&
    (candidate.status === "APPLIED" ||
      candidate.status === "SCREENING" ||
      candidate.status === "SHORTLISTED")
  );
}
