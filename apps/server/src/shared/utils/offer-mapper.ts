import type { Candidate, JobRequisition, Offer, User } from "@prisma/client";
import type {
  OfferDto,
  OfferStatus,
  OfferTimelineItemDto,
  PublicOfferDto,
  UserSummary,
} from "@roms/shared";

function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export type OfferWithRelations = Offer & {
  candidate: Candidate;
  requisition: JobRequisition;
  createdBy: User;
  updatedBy: User | null;
  approvedBy: User | null;
  extendedBy: User | null;
};

function buildTimeline(offer: OfferWithRelations): OfferTimelineItemDto[] {
  const items: OfferTimelineItemDto[] = [
    {
      key: "created",
      title: "Offer drafted",
      detail: `Created by ${offer.createdBy.firstName} ${offer.createdBy.lastName}`,
      at: offer.createdAt.toISOString(),
    },
  ];

  if (offer.submittedAt) {
    items.push({
      key: "submitted",
      title: "Submitted for approval",
      detail: null,
      at: offer.submittedAt.toISOString(),
    });
  }

  if (offer.approvedAt && offer.approvedBy) {
    items.push({
      key: "approved",
      title: `Approved by ${offer.approvedBy.firstName} ${offer.approvedBy.lastName}`,
      detail: null,
      at: offer.approvedAt.toISOString(),
    });
  }

  if (offer.approvalRejectionReason && offer.status === "APPROVAL_REJECTED") {
    items.push({
      key: "approval-rejected",
      title: "Approval rejected",
      detail: offer.approvalRejectionReason,
      at: offer.updatedAt.toISOString(),
    });
  }

  if (offer.extendedAt) {
    items.push({
      key: "extended",
      title: "Offer extended to candidate",
      detail: offer.extendedBy
        ? `Extended by ${offer.extendedBy.firstName} ${offer.extendedBy.lastName}`
        : null,
      at: offer.extendedAt.toISOString(),
    });
  }

  if (offer.status === "ACCEPTED" && offer.respondedAt) {
    items.push({
      key: "accepted",
      title: "Offer accepted",
      detail: offer.responseNotes,
      at: offer.respondedAt.toISOString(),
    });
  }

  if (offer.status === "DECLINED" && offer.respondedAt) {
    items.push({
      key: "declined",
      title: "Offer declined",
      detail: offer.declineReason,
      at: offer.respondedAt.toISOString(),
    });
  }

  if (offer.status === "WITHDRAWN") {
    items.push({
      key: "withdrawn",
      title: "Offer withdrawn",
      detail: offer.declineReason,
      at: offer.updatedAt.toISOString(),
    });
  }

  if (offer.status === "EXPIRED") {
    items.push({
      key: "expired",
      title: "Offer expired",
      detail: null,
      at: offer.updatedAt.toISOString(),
    });
  }

  return items.sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function toOfferDto(offer: OfferWithRelations): OfferDto {
  return {
    id: offer.id,
    candidate: {
      id: offer.candidate.id,
      fullName: offer.candidate.fullName,
      email: offer.candidate.email,
      status: offer.candidate.status,
    },
    requisition: {
      id: offer.requisition.id,
      title: offer.requisition.title,
      status: offer.requisition.status,
    },
    status: offer.status as OfferStatus,
    jobTitle: offer.jobTitle,
    employmentType: offer.employmentType,
    workMode: offer.workMode,
    baseSalary: offer.baseSalary,
    currency: offer.currency,
    joiningDate: offer.joiningDate.toISOString().slice(0, 10),
    validUntil: offer.validUntil.toISOString(),
    terms: offer.terms,
    internalNotes: offer.internalNotes,
    approvalRejectionReason: offer.approvalRejectionReason,
    declineReason: offer.declineReason,
    responseNotes: offer.responseNotes,
    timeline: buildTimeline(offer),
    createdBy: toUserSummary(offer.createdBy),
    updatedBy: offer.updatedBy ? toUserSummary(offer.updatedBy) : null,
    approvedBy: offer.approvedBy ? toUserSummary(offer.approvedBy) : null,
    extendedBy: offer.extendedBy ? toUserSummary(offer.extendedBy) : null,
    submittedAt: offer.submittedAt?.toISOString() ?? null,
    approvedAt: offer.approvedAt?.toISOString() ?? null,
    extendedAt: offer.extendedAt?.toISOString() ?? null,
    respondedAt: offer.respondedAt?.toISOString() ?? null,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

export function toPublicOfferDto(offer: OfferWithRelations): PublicOfferDto {
  return {
    id: offer.id,
    candidateName: offer.candidate.fullName,
    jobTitle: offer.jobTitle,
    employmentType: offer.employmentType,
    workMode: offer.workMode,
    baseSalary: offer.baseSalary,
    currency: offer.currency,
    joiningDate: offer.joiningDate.toISOString().slice(0, 10),
    validUntil: offer.validUntil.toISOString(),
    terms: offer.terms,
    status: offer.status as OfferStatus,
    requisitionTitle: offer.requisition.title,
  };
}

export const offerInclude = {
  candidate: true,
  requisition: true,
  createdBy: true,
  updatedBy: true,
  approvedBy: true,
  extendedBy: true,
} as const;
