import type { Prisma } from "@prisma/client";
import type { ListOnboardingQueryInput } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { onboardingCaseInclude } from "../../shared/utils/onboarding-mapper.js";

function buildWhere(
  query: ListOnboardingQueryInput,
  scope: Prisma.OnboardingCaseWhereInput,
): Prisma.OnboardingCaseWhereInput {
  const where: Prisma.OnboardingCaseWhereInput = {
    ...scope,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.candidateId) {
    where.candidateId = query.candidateId;
  }

  if (query.requisitionId) {
    where.requisitionId = query.requisitionId;
  }

  if (query.search) {
    where.OR = [
      {
        candidate: {
          fullName: { contains: query.search, mode: "insensitive" },
        },
      },
      {
        candidate: { email: { contains: query.search, mode: "insensitive" } },
      },
      {
        requisition: { title: { contains: query.search, mode: "insensitive" } },
      },
      {
        offer: { jobTitle: { contains: query.search, mode: "insensitive" } },
      },
      {
        employee: {
          employeeCode: { contains: query.search, mode: "insensitive" },
        },
      },
    ];
  }

  return where;
}

export const onboardingRepository = {
  findMany(query: ListOnboardingQueryInput, scope: Prisma.OnboardingCaseWhereInput) {
    const where = buildWhere(query, scope);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.onboardingCase.findMany({
        where,
        include: onboardingCaseInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: query.limit,
      }),
      prisma.onboardingCase.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.onboardingCase.findUnique({
      where: { id },
      include: onboardingCaseInclude,
    });
  },

  findByOfferId(offerId: string) {
    return prisma.onboardingCase.findUnique({
      where: { offerId },
      include: onboardingCaseInclude,
    });
  },
};
