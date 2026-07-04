import type { AuthUser, CandidateDto, OfferDto } from "@roms/shared";

export function canAccessOffers(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canManageOffers(user: AuthUser): boolean {
  return user.role === "HR_ADMIN" || user.role === "RECRUITER";
}

export function canCreateOffer(user: AuthUser): boolean {
  return canManageOffers(user);
}

export function canCreateOfferForCandidate(
  user: AuthUser,
  candidate: Pick<CandidateDto, "status">,
): boolean {
  return (
    canManageOffers(user) &&
    (candidate.status === "SHORTLISTED" || candidate.status === "SELECTED")
  );
}

export function canEditOffer(user: AuthUser, offer: OfferDto): boolean {
  if (!canManageOffers(user)) {
    return false;
  }

  if (
    offer.status === "ACCEPTED" ||
    offer.status === "DECLINED" ||
    offer.status === "WITHDRAWN" ||
    offer.status === "EXPIRED"
  ) {
    return false;
  }

  return offer.status === "DRAFT" || offer.status === "APPROVAL_REJECTED";
}

export function canDeleteOffer(user: AuthUser, offer: OfferDto): boolean {
  return canManageOffers(user) && offer.status === "DRAFT";
}

export function canSubmitOffer(user: AuthUser, offer: OfferDto): boolean {
  return (
    canManageOffers(user) &&
    (offer.status === "DRAFT" || offer.status === "APPROVAL_REJECTED")
  );
}

export function canApproveOffer(user: AuthUser, offer: OfferDto): boolean {
  return (
    (user.role === "HR_ADMIN" || user.role === "HIRING_MANAGER") &&
    offer.status === "PENDING_APPROVAL"
  );
}

export function canExtendOffer(user: AuthUser, offer: OfferDto): boolean {
  return canManageOffers(user) && offer.status === "APPROVED";
}

export function canWithdrawOffer(user: AuthUser, offer: OfferDto): boolean {
  if (!canManageOffers(user) || offer.status === "ACCEPTED") {
    return false;
  }

  return (
    offer.status === "DRAFT" ||
    offer.status === "APPROVED" ||
    offer.status === "EXTENDED" ||
    offer.status === "PENDING_APPROVAL" ||
    offer.status === "APPROVAL_REJECTED"
  );
}

export function canRecordOfferResponse(user: AuthUser, offer: OfferDto): boolean {
  return canManageOffers(user) && offer.status === "EXTENDED";
}
