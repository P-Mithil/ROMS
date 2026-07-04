import type { OfferStatus, Prisma } from "@prisma/client";
import type { ListOffersQueryInput } from "@roms/shared";
import { ACTIVE_OFFER_STATUSES } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { offerInclude } from "../../shared/utils/offer-mapper.js";

function buildWhere(
  query: ListOffersQueryInput,
  scope: Prisma.OfferWhereInput,
): Prisma.OfferWhereInput {
  const where: Prisma.OfferWhereInput = {
    ...scope,
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status as OfferStatus;
  }

  if (query.candidateId) {
    where.candidateId = query.candidateId;
  }

  if (query.requisitionId) {
    where.requisitionId = query.requisitionId;
  }

  if (query.search) {
    where.OR = [
      { candidate: { fullName: { contains: query.search, mode: "insensitive" } } },
      { candidate: { email: { contains: query.search, mode: "insensitive" } } },
      { jobTitle: { contains: query.search, mode: "insensitive" } },
      { requisition: { title: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export const offersRepository = {
  findMany(query: ListOffersQueryInput, scope: Prisma.OfferWhereInput) {
    const where = buildWhere(query, scope);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.offer.findMany({
        where,
        include: offerInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: query.limit,
      }),
      prisma.offer.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.offer.findFirst({
      where: { id, deletedAt: null },
      include: offerInclude,
    });
  },

  findActiveByCandidateId(candidateId: string) {
    return prisma.offer.findFirst({
      where: {
        candidateId,
        deletedAt: null,
        status: { in: [...ACTIVE_OFFER_STATUSES] },
      },
      include: offerInclude,
    });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.offerResponseToken.findFirst({
      where: { tokenHash },
      include: {
        offer: {
          include: offerInclude,
        },
      },
    });
  },

  create(data: {
    candidateId: string;
    requisitionId: string;
    jobTitle: string;
    employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" | "PART_TIME";
    workMode: "OFFICE" | "HYBRID" | "REMOTE";
    baseSalary: number;
    currency: string;
    joiningDate: Date;
    validUntil: Date;
    terms?: string | null;
    internalNotes?: string | null;
    createdById: string;
  }) {
    return prisma.offer.create({
      data: {
        ...data,
        status: "DRAFT",
        updatedById: data.createdById,
      },
      include: offerInclude,
    });
  },

  update(
    id: string,
    data: {
      jobTitle?: string;
      employmentType?: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" | "PART_TIME";
      workMode?: "OFFICE" | "HYBRID" | "REMOTE";
      baseSalary?: number;
      currency?: string;
      joiningDate?: Date;
      validUntil?: Date;
      terms?: string | null;
      internalNotes?: string | null;
      status?: OfferStatus;
      submittedAt?: Date | null;
      approvedById?: string | null;
      approvedAt?: Date | null;
      approvalRejectionReason?: string | null;
      extendedAt?: Date | null;
      extendedById?: string | null;
      respondedAt?: Date | null;
      declineReason?: string | null;
      responseNotes?: string | null;
      updatedById?: string | null;
      deletedAt?: Date | null;
    },
  ) {
    return prisma.offer.update({
      where: { id },
      data,
      include: offerInclude,
    });
  },

  replaceResponseToken(offerId: string, tokenHash: string, expiresAt: Date) {
    return prisma.$transaction([
      prisma.offerResponseToken.deleteMany({ where: { offerId } }),
      prisma.offerResponseToken.create({
        data: {
          offerId,
          tokenHash,
          expiresAt,
        },
      }),
    ]);
  },

  markTokenUsed(tokenId: string) {
    return prisma.offerResponseToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  },
};
