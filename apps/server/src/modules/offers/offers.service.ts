import type { OfferStatus, Prisma } from "@prisma/client";
import type {
  CreateOfferInput,
  ListOffersQueryInput,
  PublicDeclineOfferInput,
  RecordOfferAcceptanceInput,
  RecordOfferDeclineInput,
  RejectOfferApprovalInput,
  UpdateOfferInput,
  WithdrawOfferInput,
} from "@roms/shared";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import {
  offerInclude,
  toOfferDto,
  toPublicOfferDto,
} from "../../shared/utils/offer-mapper.js";
import { offersRepository } from "./offers.repository.js";
import { createPendingOnboardingCase } from "../onboarding/onboarding-cases.service.js";

type Actor = AuthenticatedUser;

const EDITABLE_OFFER_STATUSES: OfferStatus[] = ["DRAFT", "APPROVAL_REJECTED"];

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateResponseToken() {
  return randomBytes(32).toString("base64url");
}

function buildScope(actor: Actor): Prisma.OfferWhereInput {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }

  throw new ForbiddenError("You do not have access to offers");
}

function assertCanManage(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError("You do not have access to manage offers");
}

function assertCanApprove(
  offer: { requisition: { hiringManagerId: string } },
  actor: Actor,
) {
  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (
    actor.role === "HIRING_MANAGER" &&
    offer.requisition.hiringManagerId === actor.id
  ) {
    return;
  }

  throw new ForbiddenError("You do not have access to approve this offer");
}

async function getScopedOffer(id: string, actor: Actor) {
  const offer = await offersRepository.findById(id);
  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  const scope = buildScope(actor);
  const scoped = await prisma.offer.findFirst({
    where: {
      id: offer.id,
      deletedAt: null,
      ...scope,
    },
    include: offerInclude,
  });

  if (!scoped) {
    throw new ForbiddenError("You do not have access to this offer");
  }

  return scoped;
}

async function expireOfferIfNeeded<T extends { id: string; status: OfferStatus; validUntil: Date }>(
  offer: T,
) {
  if (offer.status !== "EXTENDED" || offer.validUntil > new Date()) {
    return offer;
  }

  return offersRepository.update(offer.id, {
    status: "EXPIRED",
    updatedById: null,
  });
}

async function validateCandidateForOffer(candidateId: string, actor: Actor) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, deletedAt: null },
    include: { requisition: true },
  });

  if (!candidate) {
    throw new BadRequestError("Candidate not found");
  }

  if (candidate.status !== "SHORTLISTED" && candidate.status !== "SELECTED") {
    throw new BadRequestError(
      "Candidate must be SHORTLISTED or SELECTED before an offer can be created",
      "INVALID_CANDIDATE_STATUS",
    );
  }

  if (candidate.requisition.deletedAt || candidate.requisition.status !== "OPEN") {
    throw new BadRequestError(
      "Offers can only be created for OPEN requisitions",
      "INVALID_REQUISITION_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return candidate;
  }

  if (
    actor.role === "RECRUITER" &&
    candidate.requisition.createdById === actor.id
  ) {
    return candidate;
  }

  throw new ForbiddenError("You do not have access to this candidate");
}

async function ensureNoActiveOffer(candidateId: string, excludeOfferId?: string) {
  const active = await offersRepository.findActiveByCandidateId(candidateId);
  if (active && active.id !== excludeOfferId) {
    throw new ConflictError("Candidate already has an active offer in progress");
  }
}

function ensureEditable(offer: { status: OfferStatus }) {
  if (!EDITABLE_OFFER_STATUSES.includes(offer.status)) {
    throw new BadRequestError(
      "Only draft or approval-rejected offers can be edited",
      "READ_ONLY_OFFER",
    );
  }
}

async function completeAcceptance(
  offerId: string,
  input: { notes?: string | null },
  actorId?: string,
) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: offerInclude,
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  if (offer.status !== "EXTENDED") {
    throw new BadRequestError(
      "Only extended offers can be accepted",
      "INVALID_OFFER_STATUS",
    );
  }

  if (offer.validUntil <= new Date()) {
    await offersRepository.update(offer.id, { status: "EXPIRED" });
    throw new BadRequestError("Offer has expired", "OFFER_EXPIRED");
  }

  const updatedOffer = await prisma.$transaction(async (tx) => {
    const nextOffer = await tx.offer.update({
      where: { id: offer.id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
        responseNotes: input.notes ?? null,
        updatedById: actorId ?? offer.updatedById,
      },
      include: offerInclude,
    });

    await tx.candidate.update({
      where: { id: offer.candidateId },
      data: {
        status: "OFFER_ACCEPTED",
        updatedById: actorId ?? offer.updatedById ?? offer.createdById,
      },
    });

    await createPendingOnboardingCase(tx, {
      id: nextOffer.id,
      candidateId: nextOffer.candidateId,
      requisitionId: nextOffer.requisitionId,
    });

    return nextOffer;
  });

  return updatedOffer;
}

async function completeDecline(
  offerId: string,
  input: { reason: string; notes?: string | null },
  actorId?: string,
) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: offerInclude,
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  if (offer.status !== "EXTENDED") {
    throw new BadRequestError(
      "Only extended offers can be declined",
      "INVALID_OFFER_STATUS",
    );
  }

  if (offer.validUntil <= new Date()) {
    await offersRepository.update(offer.id, { status: "EXPIRED" });
    throw new BadRequestError("Offer has expired", "OFFER_EXPIRED");
  }

  const updatedOffer = await prisma.$transaction(async (tx) => {
    const nextOffer = await tx.offer.update({
      where: { id: offer.id },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
        declineReason: input.reason,
        responseNotes: input.notes ?? null,
        updatedById: actorId ?? offer.updatedById,
      },
      include: offerInclude,
    });

    await tx.candidate.update({
      where: { id: offer.candidateId },
      data: {
        status: "OFFER_DECLINED",
        updatedById: actorId ?? offer.updatedById ?? offer.createdById,
      },
    });

    return nextOffer;
  });

  return updatedOffer;
}

export const offersService = {
  async list(query: ListOffersQueryInput, actor: Actor) {
    const scope = buildScope(actor);
    const [items, total] = await offersRepository.findMany(query, scope);

    const refreshed = await Promise.all(items.map((item) => expireOfferIfNeeded(item)));

    return {
      items: refreshed.map(toOfferDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, actor: Actor) {
    const offer = await expireOfferIfNeeded(await getScopedOffer(id, actor));
    return toOfferDto(offer);
  },

  async create(input: CreateOfferInput, actor: Actor) {
    assertCanManage(actor);
    const candidate = await validateCandidateForOffer(input.candidateId, actor);
    await ensureNoActiveOffer(candidate.id);

    const offer = await prisma.$transaction(async (tx) => {
      if (candidate.status === "SHORTLISTED") {
        await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            status: "SELECTED",
            updatedById: actor.id,
          },
        });
      }

      return tx.offer.create({
        data: {
          candidateId: candidate.id,
          requisitionId: candidate.requisitionId,
          jobTitle: input.jobTitle ?? candidate.requisition.title,
          employmentType: input.employmentType ?? candidate.requisition.employmentType,
          workMode: input.workMode ?? candidate.requisition.workMode,
          baseSalary: input.baseSalary,
          currency: input.currency ?? "INR",
          joiningDate: new Date(`${input.joiningDate}T00:00:00`),
          validUntil: new Date(input.validUntil),
          terms: input.terms ?? null,
          internalNotes: input.internalNotes ?? null,
          status: "DRAFT",
          createdById: actor.id,
          updatedById: actor.id,
        },
        include: offerInclude,
      });
    });

    return toOfferDto(offer);
  },

  async update(id: string, input: UpdateOfferInput, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedOffer(id, actor);
    ensureEditable(existing);

    const offer = await offersRepository.update(existing.id, {
      jobTitle: input.jobTitle,
      employmentType: input.employmentType,
      workMode: input.workMode,
      baseSalary: input.baseSalary,
      currency: input.currency,
      joiningDate: input.joiningDate
        ? new Date(`${input.joiningDate}T00:00:00`)
        : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      terms: input.terms,
      internalNotes: input.internalNotes,
      status: existing.status === "APPROVAL_REJECTED" ? "DRAFT" : undefined,
      approvalRejectionReason:
        existing.status === "APPROVAL_REJECTED" ? null : undefined,
      updatedById: actor.id,
    });

    return toOfferDto(offer);
  },

  async delete(id: string, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedOffer(id, actor);

    if (existing.status !== "DRAFT") {
      throw new BadRequestError(
        "Only draft offers can be deleted",
        "INVALID_OFFER_STATUS",
      );
    }

    await offersRepository.update(existing.id, {
      deletedAt: new Date(),
      updatedById: actor.id,
    });
  },

  async submit(id: string, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedOffer(id, actor);

    if (existing.status !== "DRAFT" && existing.status !== "APPROVAL_REJECTED") {
      throw new BadRequestError(
        "Only draft or approval-rejected offers can be submitted",
        "INVALID_OFFER_STATUS",
      );
    }

    const offer = await offersRepository.update(existing.id, {
      status: "PENDING_APPROVAL",
      submittedAt: new Date(),
      approvalRejectionReason: null,
      approvedById: null,
      approvedAt: null,
      updatedById: actor.id,
    });

    return toOfferDto(offer);
  },

  async approve(id: string, actor: Actor) {
    const existing = await getScopedOffer(id, actor);
    assertCanApprove(existing, actor);

    if (existing.status !== "PENDING_APPROVAL") {
      throw new BadRequestError(
        "Only pending offers can be approved",
        "INVALID_OFFER_STATUS",
      );
    }

    const offer = await offersRepository.update(existing.id, {
      status: "APPROVED",
      approvedById: actor.id,
      approvedAt: new Date(),
      approvalRejectionReason: null,
      updatedById: actor.id,
    });

    return toOfferDto(offer);
  },

  async rejectApproval(id: string, input: RejectOfferApprovalInput, actor: Actor) {
    const existing = await getScopedOffer(id, actor);
    assertCanApprove(existing, actor);

    if (existing.status !== "PENDING_APPROVAL") {
      throw new BadRequestError(
        "Only pending offers can be rejected",
        "INVALID_OFFER_STATUS",
      );
    }

    const offer = await offersRepository.update(existing.id, {
      status: "APPROVAL_REJECTED",
      approvalRejectionReason: input.reason,
      approvedById: null,
      approvedAt: null,
      updatedById: actor.id,
    });

    return toOfferDto(offer);
  },

  async extend(id: string, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedOffer(id, actor);

    if (existing.status !== "APPROVED") {
      throw new BadRequestError(
        "Only approved offers can be extended",
        "INVALID_OFFER_STATUS",
      );
    }

    if (existing.validUntil <= new Date()) {
      throw new BadRequestError(
        "Offer validity must be in the future before extending",
        "INVALID_OFFER_VALIDITY",
      );
    }

    const responseToken = generateResponseToken();
    const tokenHash = hashToken(responseToken);

    const offer = await offersRepository.update(existing.id, {
      status: "EXTENDED",
      extendedAt: new Date(),
      extendedById: actor.id,
      updatedById: actor.id,
    });

    await offersRepository.replaceResponseToken(
      offer.id,
      tokenHash,
      offer.validUntil,
    );

    return {
      offer: toOfferDto(offer),
      responseToken,
    };
  },

  async withdraw(id: string, input: WithdrawOfferInput, actor: Actor) {
    assertCanManage(actor);
    const existing = await getScopedOffer(id, actor);

    if (
      existing.status !== "DRAFT" &&
      existing.status !== "APPROVED" &&
      existing.status !== "EXTENDED" &&
      existing.status !== "PENDING_APPROVAL" &&
      existing.status !== "APPROVAL_REJECTED"
    ) {
      throw new BadRequestError(
        "This offer cannot be withdrawn",
        "INVALID_OFFER_STATUS",
      );
    }

    const offer = await offersRepository.update(existing.id, {
      status: "WITHDRAWN",
      declineReason: input.reason,
      updatedById: actor.id,
    });

    await prisma.offerResponseToken.deleteMany({ where: { offerId: offer.id } });

    return toOfferDto(offer);
  },

  async recordAcceptance(id: string, input: RecordOfferAcceptanceInput, actor: Actor) {
    assertCanManage(actor);
    await getScopedOffer(id, actor);
    const offer = await completeAcceptance(id, input, actor.id);
    return toOfferDto(offer);
  },

  async recordDecline(id: string, input: RecordOfferDeclineInput, actor: Actor) {
    assertCanManage(actor);
    await getScopedOffer(id, actor);
    const offer = await completeDecline(
      id,
      { reason: input.reason, notes: input.notes },
      actor.id,
    );
    return toOfferDto(offer);
  },

  async getPublicOffer(token: string) {
    const tokenRecord = await offersRepository.findByTokenHash(hashToken(token));
    if (!tokenRecord) {
      throw new NotFoundError("Offer link not found");
    }

    if (tokenRecord.usedAt) {
      throw new BadRequestError("Offer link has already been used", "OFFER_TOKEN_USED");
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw new BadRequestError("Offer link has expired", "OFFER_TOKEN_EXPIRED");
    }

    const offer = await expireOfferIfNeeded(tokenRecord.offer);

    if (offer.status !== "EXTENDED") {
      throw new BadRequestError(
        "This offer is no longer available for response",
        "INVALID_OFFER_STATUS",
      );
    }

    return toPublicOfferDto(offer);
  },

  async acceptPublic(token: string) {
    const tokenRecord = await offersRepository.findByTokenHash(hashToken(token));
    if (!tokenRecord) {
      throw new NotFoundError("Offer link not found");
    }

    if (tokenRecord.usedAt) {
      throw new BadRequestError("Offer link has already been used", "OFFER_TOKEN_USED");
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw new BadRequestError("Offer link has expired", "OFFER_TOKEN_EXPIRED");
    }

    const offer = await completeAcceptance(tokenRecord.offer.id, { notes: null });
    await offersRepository.markTokenUsed(tokenRecord.id);

    return toPublicOfferDto(offer);
  },

  async declinePublic(token: string, input: PublicDeclineOfferInput) {
    const tokenRecord = await offersRepository.findByTokenHash(hashToken(token));
    if (!tokenRecord) {
      throw new NotFoundError("Offer link not found");
    }

    if (tokenRecord.usedAt) {
      throw new BadRequestError("Offer link has already been used", "OFFER_TOKEN_USED");
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw new BadRequestError("Offer link has expired", "OFFER_TOKEN_EXPIRED");
    }

    const offer = await completeDecline(
      tokenRecord.offer.id,
      { reason: input.reason },
    );
    await offersRepository.markTokenUsed(tokenRecord.id);

    return toPublicOfferDto(offer);
  },
};

export async function countAcceptedOffers(requisitionId: string) {
  return prisma.offer.count({
    where: {
      requisitionId,
      status: "ACCEPTED",
      deletedAt: null,
    },
  });
}
